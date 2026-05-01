import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { mkdir, readdir, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { $ } from "bun";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DATA_DIR = resolve(homedir(), ".local/share/learning-loop");
const MEMORY_FILE = join(DATA_DIR, "memory.json");
const EXPERIENCES_FILE = join(DATA_DIR, "experiences.jsonl");
const REFLECTIONS_FILE = join(DATA_DIR, "reflections.jsonl");
const STATE_FILE = join(DATA_DIR, "state.json");
const REFLECTION_SESSION_FILE = join(DATA_DIR, "reflection-session.json");
const AUTO_SKILLS_DIR = resolve(homedir(), ".config/opencode/skills/auto");

const MEMORY_TOOLS = new Set([
  "memory_save",
  "memory_search",
  "memory_list",
  "memory_delete",
]);

const MAX_OUTPUT_SIZE = 10 * 1024;
const ERROR_PATTERN = /Error|error|exception|throw|failed/;

/* Bloat control constants */
const MAX_EXPERIENCE_LINES = 5_000;
const MAX_EXPERIENCE_ARCHIVE_MB = 50;
const MAX_MEMORIES = 1_000;
const MEMORY_DEDUP_TOKEN_OVERLAP = 0.75;

/* Reflection fallback: reflect every N experiences even if compaction never fires */
const REFLECT_EVERY_N_EXPERIENCES = 30;

/* Contradiction detection constants */
const CONTRADICTION_MIN_OVERLAP = 0.3;
const CONTRADICTION_MAX_OVERLAP = 0.74;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  access_count: number;
}

interface State {
  lastProcessedIndex: number;
}

interface Experience {
  [key: string]: unknown;
}

interface ReflectionLogEntry {
  timestamp: string;
  session_id: string;
  facts_count: number;
  skills_created_count: number;
  error?: string;
}

interface LLMResult {
  facts: string[];
  skills: Array<{ name: string; description: string; body: string }>;
}

/* ------------------------------------------------------------------ */
/*  Skill helpers                                                      */
/* ------------------------------------------------------------------ */

function sanitizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureAutoSkillsDir(): Promise<void> {
  await mkdir(AUTO_SKILLS_DIR, { recursive: true });
}

async function dirExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function createSkill(
  name: string,
  description: string,
  body: string,
): Promise<{ created: boolean; reason?: string; path?: string }> {
  try {
    await ensureAutoSkillsDir();

    const sanitized = sanitizeSkillName(name);
    if (!sanitized) {
      return { created: false, reason: "invalid_name" };
    }

    const skillDir = join(AUTO_SKILLS_DIR, sanitized);

    if (await dirExists(skillDir)) {
      return { created: false, reason: "already_exists" };
    }

    await mkdir(skillDir, { recursive: true });

    const content = `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n`;
    const filePath = join(skillDir, "SKILL.md");
    await Bun.write(filePath, content);

    return { created: true, path: filePath };
  } catch {
    return { created: false, reason: "filesystem_error" };
  }
}

async function listAutoSkills(): Promise<string[]> {
  try {
    await ensureAutoSkillsDir();
    const entries = await readdir(AUTO_SKILLS_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Memory helpers                                                     */
/* ------------------------------------------------------------------ */

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function loadMemories(): Promise<MemoryEntry[]> {
  const file = Bun.file(MEMORY_FILE);
  if (!(await file.exists())) {
    return [];
  }
  try {
    const text = await file.text();
    if (!text.trim()) {
      return [];
    }
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

async function saveMemories(memories: MemoryEntry[]): Promise<void> {
  await ensureDataDir();
  await Bun.write(MEMORY_FILE, JSON.stringify(memories, null, 2));
}

/* Bloat control: memory deduplication */
function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function findDuplicateMemory(
  content: string,
  memories: MemoryEntry[],
): MemoryEntry | undefined {
  const newTokens = tokenize(content);
  if (newTokens.length === 0) return undefined;

  for (const mem of memories) {
    const memTokens = tokenize(mem.content);
    if (memTokens.length === 0) continue;
    const sim = jaccardSimilarity(newTokens, memTokens);
    if (sim >= MEMORY_DEDUP_TOKEN_OVERLAP) {
      return mem;
    }
  }
  return undefined;
}

/* Contradiction detection: high overlap but not identical = potential conflict */
function findContradiction(
  content: string,
  memories: MemoryEntry[],
): MemoryEntry | undefined {
  const newTokens = tokenize(content);
  if (newTokens.length === 0) return undefined;

  for (const mem of memories) {
    const memTokens = tokenize(mem.content);
    if (memTokens.length === 0) continue;
    const sim = jaccardSimilarity(newTokens, memTokens);
    if (sim >= CONTRADICTION_MIN_OVERLAP && sim < CONTRADICTION_MAX_OVERLAP) {
      return mem;
    }
  }
  return undefined;
}

/* Bloat control: memory pruning */
function pruneMemories(memories: MemoryEntry[]): MemoryEntry[] {
  if (memories.length <= MAX_MEMORIES) return memories;

  // Score = access_count * recency_weight
  // recency_weight decays over time: 1.0 at day 0, ~0.5 at 30 days
  const now = Date.now();
  const scored = memories.map((m) => {
    const ageDays =
      (now - new Date(m.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.1, 1 - ageDays / 60); // 60-day half-life
    const score = m.access_count * recencyWeight;
    return { memory: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const kept = scored.slice(0, MAX_MEMORIES).map((s) => s.memory);

  return kept;
}

async function addMemory(
  content: string,
  tags: string[],
): Promise<{ id: string; action: "created" | "updated" }> {
  const memories = await loadMemories();

  // Deduplication: update existing instead of creating duplicate
  const duplicate = findDuplicateMemory(content, memories);
  if (duplicate) {
    duplicate.content = content; // keep newest phrasing
    duplicate.tags = [...new Set([...duplicate.tags, ...tags])];
    duplicate.updated_at = new Date().toISOString();
    duplicate.access_count += 1;
    await saveMemories(memories);
    debouncedSync();
    return { id: duplicate.id, action: "updated" };
  }

  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    content,
    tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    access_count: 0,
  };
  memories.push(entry);

  // Prune if over limit
  const pruned = pruneMemories(memories);
  await saveMemories(pruned);
  debouncedSync();

  return { id: entry.id, action: "created" };
}

/* Bloat control: experience log rotation */
async function rotateExperiencesLog(): Promise<void> {
  const file = Bun.file(EXPERIENCES_FILE);
  if (!(await file.exists())) return;

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length <= MAX_EXPERIENCE_LINES) return;

  // Archive old experiences
  const archivePath = join(DATA_DIR, `experiences-${Date.now()}.jsonl.archive`);
  const keepCount = Math.floor(MAX_EXPERIENCE_LINES * 0.5); // keep newest 50%
  const archiveLines = lines.slice(0, lines.length - keepCount);
  const keepLines = lines.slice(lines.length - keepCount);

  await Bun.write(archivePath, archiveLines.join("\n") + "\n");
  await Bun.write(EXPERIENCES_FILE, keepLines.join("\n") + "\n");

  // Also reset state so we don't try to process archived lines
  await writeState({ lastProcessedIndex: 0 });

  // Clean up old archives to prevent disk bloat
  await cleanupOldArchives();
}

/* Bloat control: remove old experience archives */
async function cleanupOldArchives(): Promise<void> {
  try {
    const entries = await readdir(DATA_DIR, { withFileTypes: true });
    const archives = entries
      .filter((e) => e.isFile() && e.name.endsWith(".jsonl.archive"))
      .map((e) => ({
        name: e.name,
        path: join(DATA_DIR, e.name),
        time: parseInt(
          e.name.replace("experiences-", "").replace(".jsonl.archive", ""),
          10,
        ),
      }))
      .filter((a) => !isNaN(a.time))
      .sort((a, b) => b.time - a.time);

    // Keep the 3 most recent archives, delete the rest
    const toDelete = archives.slice(3);
    for (const archive of toDelete) {
      await Bun.file(archive.path)
        .delete?.()
        .catch(() => {});
    }
  } catch {
    // best-effort cleanup
  }
}

/* ------------------------------------------------------------------ */
/*  Git sync                                                           */
/* ------------------------------------------------------------------ */

const SYNC_REPO =
  process.env.LEARNING_LOOP_SYNC_REPO ||
  "git@github.com:clarenzmauro/opencode-memories.git";
const SYNC_DEBOUNCE_MS = 30_000;

let syncTimeout: ReturnType<typeof setTimeout> | undefined;
let syncInFlight = false;

async function gitDirInitialized(): Promise<boolean> {
  try {
    const gitDir = join(DATA_DIR, ".git");
    await access(gitDir);
    return true;
  } catch {
    return false;
  }
}

async function initGitRepo(): Promise<void> {
  if (await gitDirInitialized()) return;
  try {
    await $`cd ${DATA_DIR} && git init`.quiet();
    await $`cd ${DATA_DIR} && git remote add origin ${SYNC_REPO}`.quiet();
    await $`cd ${DATA_DIR} && git config user.email "opencode@local"`.quiet();
    await $`cd ${DATA_DIR} && git config user.name "OpenCode"`.quiet();
    // Create a .gitignore to ignore archives
    const gitignorePath = join(DATA_DIR, ".gitignore");
    await Bun.write(gitignorePath, "*.archive\n");
  } catch {
    // best-effort init
  }
}

async function gitPull(): Promise<{ ok: boolean; message: string }> {
  try {
    await initGitRepo();
    await $`cd ${DATA_DIR} && git fetch origin main --depth=1`.quiet();
    // If remote has history, try to merge; if not, ignore
    const result =
      await $`cd ${DATA_DIR} && git merge origin/main --allow-unrelated-histories -m "sync"`.quiet();
    return { ok: true, message: "Pulled latest memories" };
  } catch {
    // likely no remote history yet or already up to date
    return { ok: true, message: "Nothing to pull" };
  }
}

async function gitPush(): Promise<{ ok: boolean; message: string }> {
  if (syncInFlight) return { ok: true, message: "Sync already in progress" };
  syncInFlight = true;

  try {
    await initGitRepo();

    // Stage all data files
    await $`cd ${DATA_DIR} && git add -A`.quiet();

    // Check if there are changes
    const status = await $`cd ${DATA_DIR} && git status --porcelain`.text();
    if (!status.trim()) {
      syncInFlight = false;
      return { ok: true, message: "No changes to sync" };
    }

    await $`cd ${DATA_DIR} && git commit -m "Auto-sync memories (${new Date().toISOString()})"`.quiet();
    await $`cd ${DATA_DIR} && git push -u origin main`.quiet();

    syncInFlight = false;
    return { ok: true, message: "Memories synced to remote" };
  } catch (err) {
    syncInFlight = false;
    return {
      ok: false,
      message: `Sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function debouncedSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    gitPush().catch(() => {});
  }, SYNC_DEBOUNCE_MS);
}

const memorySyncTool = tool({
  description:
    "Manually sync memories with the remote GitHub repository (clarenzmauro/opencode-memories). Pulls latest changes first, then pushes local changes. Requires SSH key or GitHub token configured for git auth.",
  args: {},
  async execute() {
    const pullResult = await gitPull();
    if (!pullResult.ok) {
      return JSON.stringify({ ok: false, message: pullResult.message });
    }
    const pushResult = await gitPush();
    return JSON.stringify({
      ok: pushResult.ok,
      pull: pullResult.message,
      push: pushResult.message,
    });
  },
});

/* ------------------------------------------------------------------ */
/*  Memory tools                                                       */
/* ------------------------------------------------------------------ */

const memorySaveTool = tool({
  description:
    "Save a fact, preference, or learning to persistent memory. If this contradicts an existing memory, the tool will return the conflict and NOT save—you should ask the user whether to update the old memory or keep both.",
  args: {
    content: tool.schema.string(),
    tags: tool.schema.array(tool.schema.string()).optional(),
  },
  async execute(args) {
    const memories = await loadMemories();

    // Check for contradictions before saving
    const contradiction = findContradiction(args.content, memories);
    if (contradiction) {
      return JSON.stringify({
        saved: false,
        contradiction: true,
        existing_memory: {
          id: contradiction.id,
          content: contradiction.content,
          tags: contradiction.tags,
          updated_at: contradiction.updated_at,
        },
        proposed: args.content,
        message:
          "This contradicts an existing memory. Ask the user if they want to: (1) update the existing memory, (2) save this as a new separate memory, or (3) cancel. Use memory_delete to remove the old one if they choose to update.",
      });
    }

    const result = await addMemory(args.content, args.tags ?? []);
    return JSON.stringify({
      saved: true,
      id: result.id,
      action: result.action,
    });
  },
});

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "over",
  "also",
  "get",
  "like",
  "use",
  "using",
  "prefer",
  "preference",
  "using",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

const memorySearchTool = tool({
  description:
    "Search persistent memory by keywords. Optionally filter by date range using ISO 8601 strings (e.g. 2024-01-01).",
  args: {
    query: tool.schema.string(),
    limit: tool.schema.number().optional(),
    after: tool.schema.string().optional(),
    before: tool.schema.string().optional(),
  },
  async execute(args) {
    if (!args.query || args.query.trim() === "") {
      return "[]";
    }

    const memories = await loadMemories();
    const rawQuery = args.query.trim();
    const lowerQuery = rawQuery.toLowerCase();
    const queryTokens = tokenize(rawQuery);
    const limit = args.limit ?? 10;

    // Temporal filtering
    const afterMs = args.after ? new Date(args.after).getTime() : 0;
    const beforeMs = args.before ? new Date(args.before).getTime() : Infinity;

    const scored = memories
      .filter((entry) => {
        const updated = new Date(entry.updated_at).getTime();
        return updated >= afterMs && updated <= beforeMs;
      })
      .map((entry) => {
        const lowerContent = entry.content.toLowerCase();
        const lowerTags = entry.tags.map((t) => t.toLowerCase());
        const contentTokens = tokenize(entry.content);
        const tagTokens = entry.tags.flatMap((t) => tokenize(t));
        const allText = `${lowerContent} ${lowerTags.join(" ")}`;

        let score = 0;

        // Exact match bonuses (highest priority)
        if (lowerContent === lowerQuery) score += 100;
        if (lowerTags.includes(lowerQuery)) score += 80;
        if (lowerContent.includes(lowerQuery)) score += 50;
        if (lowerTags.some((t) => t.includes(lowerQuery))) score += 30;
        if (allText.includes(lowerQuery)) score += 10;

        // Token-based scoring for partial / multi-word queries
        if (queryTokens.length > 0) {
          let tokenScore = 0;
          let matchedTokens = 0;

          for (const token of queryTokens) {
            let tokenMatched = false;

            if (contentTokens.includes(token)) {
              tokenScore += 25;
              tokenMatched = true;
            } else if (lowerContent.includes(token)) {
              tokenScore += 15;
              tokenMatched = true;
            }

            if (tagTokens.includes(token)) {
              tokenScore += 20;
              tokenMatched = true;
            } else if (lowerTags.some((t) => t.includes(token))) {
              tokenScore += 12;
              tokenMatched = true;
            }

            if (tokenMatched) matchedTokens++;
          }

          const matchRatio = matchedTokens / queryTokens.length;
          if (matchRatio >= 0.8) tokenScore += 20;
          else if (matchRatio >= 0.5) tokenScore += 10;

          if (matchRatio < 0.25 && queryTokens.length > 1) {
            tokenScore = Math.floor(tokenScore * 0.5);
          }

          score += tokenScore;
        }

        return { entry, score };
      });

    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.entry);

    for (const entry of results) {
      entry.access_count += 1;
      entry.updated_at = new Date().toISOString();
    }

    if (results.length > 0) {
      await saveMemories(memories);
    }

    return JSON.stringify(
      results.map((r) => ({
        id: r.id,
        content: r.content,
        tags: r.tags,
        access_count: r.access_count,
        updated_at: r.updated_at,
      })),
    );
  },
});

const memoryListTool = tool({
  description: "List recent memories, sorted by last access",
  args: {
    limit: tool.schema.number().optional(),
  },
  async execute(args) {
    const memories = await loadMemories();
    const limit = args.limit ?? 50;
    const sorted = memories.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    const results = sorted.slice(0, limit);

    for (const entry of results) {
      entry.access_count += 1;
      entry.updated_at = new Date().toISOString();
    }

    if (results.length > 0) {
      await saveMemories(memories);
    }

    return JSON.stringify(
      results.map((r) => ({
        id: r.id,
        content: r.content,
        tags: r.tags,
        access_count: r.access_count,
      })),
    );
  },
});

const memoryDeleteTool = tool({
  description: "Delete a memory entry by its ID",
  args: {
    id: tool.schema.string(),
  },
  async execute(args) {
    const memories = await loadMemories();
    const idx = memories.findIndex((m) => m.id === args.id);
    if (idx === -1) {
      return JSON.stringify({ deleted: false });
    }
    memories.splice(idx, 1);
    await saveMemories(memories);
    return JSON.stringify({ deleted: true });
  },
});

/* ------------------------------------------------------------------ */
/*  Experience logging                                                 */
/* ------------------------------------------------------------------ */

function summarizeOutput(output: unknown): string {
  let text: string;
  if (typeof output === "string") {
    text = output;
  } else {
    try {
      text = JSON.stringify(output);
    } catch {
      text = String(output);
    }
  }

  if (text.length > MAX_OUTPUT_SIZE) {
    return text.slice(0, MAX_OUTPUT_SIZE) + "... [truncated]";
  }
  return text;
}

function isSuccess(output: unknown): boolean {
  let text: string;
  if (typeof output === "string") {
    text = output;
  } else {
    try {
      text = JSON.stringify(output);
    } catch {
      text = String(output);
    }
  }
  return !ERROR_PATTERN.test(text);
}

let writeQueue: Promise<void> = Promise.resolve();

async function appendExperienceLine(line: string): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const file = Bun.file(EXPERIENCES_FILE);
    const existing = (await file.exists()) ? await file.text() : "";
    const separator =
      existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
    await Bun.write(EXPERIENCES_FILE, existing + separator + line + "\n");
  });
  await writeQueue;
}

async function logExperience(
  input: { tool?: string; args?: unknown; arguments?: unknown },
  output: unknown,
  sessionId: string,
): Promise<void> {
  if (!input || typeof input.tool !== "string") {
    return;
  }

  if (MEMORY_TOOLS.has(input.tool)) {
    return;
  }

  await ensureDataDir();

  // Rotate log if it's grown too large
  await rotateExperiencesLog();

  const entry = {
    tool: input.tool,
    args: input.args ?? input.arguments ?? {},
    output_summary: summarizeOutput(output),
    success: isSuccess(output),
    timestamp: new Date().toISOString(),
    session_id: sessionId,
  };

  let jsonLine: string;
  try {
    jsonLine = JSON.stringify(entry);
  } catch {
    return;
  }

  await appendExperienceLine(jsonLine);
}

/* ------------------------------------------------------------------ */
/*  Reflection engine                                                  */
/* ------------------------------------------------------------------ */

async function readState(): Promise<State> {
  try {
    const file = Bun.file(STATE_FILE);
    if (!(await file.exists())) {
      return { lastProcessedIndex: 0 };
    }
    const data = await file.json();
    if (
      typeof data.lastProcessedIndex === "number" &&
      data.lastProcessedIndex >= 0
    ) {
      return data as State;
    }
    return { lastProcessedIndex: 0 };
  } catch {
    return { lastProcessedIndex: 0 };
  }
}

async function writeState(state: State): Promise<void> {
  await ensureDataDir();
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}

async function readExperiences(): Promise<Experience[]> {
  try {
    const file = Bun.file(EXPERIENCES_FILE);
    if (!(await file.exists())) {
      return [];
    }
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const experiences: Experience[] = [];
    for (const line of lines) {
      try {
        experiences.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
    return experiences;
  } catch {
    return [];
  }
}

async function appendReflectionLog(entry: ReflectionLogEntry): Promise<void> {
  try {
    await ensureDataDir();
    const file = Bun.file(REFLECTIONS_FILE);
    const existing = (await file.exists()) ? await file.text() : "";
    await Bun.write(REFLECTIONS_FILE, existing + JSON.stringify(entry) + "\n");
  } catch {
    // best-effort
  }
}

async function getOrCreateReflectionSession(client: any): Promise<string> {
  try {
    const file = Bun.file(REFLECTION_SESSION_FILE);
    if (await file.exists()) {
      const data = await file.json();
      if (typeof data.id === "string" && data.id.length > 0) {
        return data.id;
      }
    }
  } catch {
    // ignore corrupt session file
  }

  const response = await client.session.create({
    body: { name: "learning-loop-reflection" },
  });
  const sessionId = response?.data?.id;
  if (typeof sessionId !== "string") {
    throw new Error("Failed to create reflection session: invalid response");
  }

  await ensureDataDir();
  await Bun.write(
    REFLECTION_SESSION_FILE,
    JSON.stringify({ id: sessionId }, null, 2),
  );
  return sessionId;
}

async function callLLM(
  client: any,
  reflectionSessionId: string,
  experiences: Experience[],
): Promise<LLMResult> {
  const systemPrompt = `You are an experience analyzer.

Given a list of experiences, answer:
1. What key facts were learned?
2. Were there any reusable multi-step workflows?
3. What FAILURES or mistakes occurred? What anti-patterns should be avoided? (e.g., wrong tool choice, incorrect assumptions, failed commands)

Respond ONLY with a JSON object in this exact structure (no markdown):
{
  "facts": ["fact 1", "fact 2"],
  "skills": [
    {"name": "skill-name", "description": "what it does", "body": "step-by-step workflow or pattern"}
  ],
  "anti_patterns": [
    {"pattern": "description of what went wrong", "avoid": "what to do instead"}
  ]
}

Use empty arrays if nothing relevant is found. Pay special attention to failed tool calls and errors — these are the most valuable learnings.`;

  const userPrompt = `Experiences to analyze:\n${JSON.stringify(experiences, null, 2)}`;

  const response = await client.session.prompt({
    path: { id: reflectionSessionId },
    body: {
      parts: [{ type: "text", text: userPrompt }],
      system: systemPrompt,
    },
  });

  let responseText: string;
  if (typeof response === "string") {
    responseText = response;
  } else if (response && typeof response.text === "string") {
    responseText = response.text;
  } else if (response && typeof response.content === "string") {
    responseText = response.content;
  } else {
    try {
      responseText = JSON.stringify(response);
    } catch {
      responseText = String(response);
    }
  }

  const cleaned = responseText.trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fencedMatch ? fencedMatch[1].trim() : cleaned;

  try {
    const parsed = JSON.parse(jsonStr);
    const facts: string[] = Array.isArray(parsed.facts)
      ? parsed.facts.filter((f: unknown) => typeof f === "string")
      : [];

    const skills = Array.isArray(parsed.skills)
      ? parsed.skills.filter(
          (s: unknown) =>
            s !== null &&
            typeof s === "object" &&
            typeof (s as Record<string, unknown>).name === "string" &&
            typeof (s as Record<string, unknown>).body === "string",
        )
      : [];

    // Also extract anti-patterns as memories
    const antiPatterns = Array.isArray(parsed.anti_patterns)
      ? parsed.anti_patterns.filter(
          (ap: unknown) =>
            ap !== null &&
            typeof ap === "object" &&
            typeof (ap as Record<string, unknown>).pattern === "string",
        )
      : [];

    for (const ap of antiPatterns) {
      const pattern = (ap as Record<string, unknown>).pattern as string;
      const avoid = (ap as Record<string, unknown>).avoid as string | undefined;
      const text = avoid
        ? `Avoid: ${pattern}. Instead: ${avoid}`
        : `Avoid: ${pattern}`;
      facts.push(text);
    }

    return { facts, skills };
  } catch {
    return { facts: [], skills: [] };
  }
}

async function runReflection(client: any, sessionID: string): Promise<void> {
  const experiences = await readExperiences();

  if (experiences.length === 0) {
    return;
  }

  const state = await readState();
  const unprocessed = experiences.slice(state.lastProcessedIndex);

  if (unprocessed.length < 3) {
    return;
  }

  const recent = unprocessed.slice(-20);

  let result: LLMResult;
  let error: string | undefined;

  try {
    const reflectionSessionId = await getOrCreateReflectionSession(client);
    result = await callLLM(client, reflectionSessionId, recent);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    await appendReflectionLog({
      timestamp: new Date().toISOString(),
      session_id: sessionID,
      facts_count: 0,
      skills_created_count: 0,
      error,
    });
    return;
  }

  let factsCount = 0;
  let skillsCount = 0;

  for (const fact of result.facts) {
    try {
      const memResult = await addMemory(fact, ["learning-loop", "reflection"]);
      if (memResult.action === "created") factsCount++;
    } catch {
      // continue dispatching
    }
  }

  for (const skill of result.skills) {
    try {
      await createSkill(skill.name, skill.description || "", skill.body);
      skillsCount++;
    } catch {
      // continue dispatching
    }
  }

  await appendReflectionLog({
    timestamp: new Date().toISOString(),
    session_id: sessionID,
    facts_count: factsCount,
    skills_created_count: skillsCount,
  });

  await writeState({ lastProcessedIndex: experiences.length });
  debouncedSync();
}

/* ------------------------------------------------------------------ */
/*  Plugin export                                                      */
/* ------------------------------------------------------------------ */

const LearningLoopPlugin: Plugin = async (ctx) => {
  const { client } = ctx;

  const logError = (message: string, err: unknown) => {
    client.app
      .log({
        body: {
          service: "learning-loop",
          level: "error",
          message: `${message} ${err instanceof Error ? err.message : String(err)}`,
        },
      })
      .catch(() => {});
  };

  try {
    await client.app.log({
      body: {
        service: "learning-loop",
        level: "info",
        message: "Plugin initialized",
      },
    });

    // Auto-pull latest memories on init (fire-and-forget)
    gitPull()
      .then((result) => {
        if (result.ok && result.message !== "Nothing to pull") {
          client.app
            .log({
              body: {
                service: "learning-loop",
                level: "info",
                message: `Memory sync: ${result.message}`,
              },
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return {
      "tool.execute.before": async (input: any, output: any) => {
        // Belt-and-suspenders .env protection (config permission is primary)
        if (
          input.tool === "read" &&
          output.args?.filePath &&
          /\.env($|\.|\/)/.test(output.args.filePath)
        ) {
          throw new Error(
            "Access to .env files is blocked. Use environment variables or a secrets manager instead.",
          );
        }
      },
      "tool.execute.after": async (input: any, output: any) => {
        try {
          await logExperience(input, output, input.sessionID);

          // Fallback reflection trigger: if compaction events never fire, still reflect periodically
          const experiences = await readExperiences();
          const state = await readState();
          const unprocessed = experiences.length - state.lastProcessedIndex;
          if (unprocessed >= REFLECT_EVERY_N_EXPERIENCES && input.sessionID) {
            runReflection(client, input.sessionID).catch((error) => {
              logError("Fallback reflection failed:", error);
            });
          }
        } catch (error) {
          logError("Failed to log experience:", error);
        }
      },
      "experimental.session.compacting": async (input: any, output: any) => {
        // Topic-aware memory injection: fetch session title, search memories, inject matches
        try {
          const sessionRes = await client.session.get({
            path: { sessionID: input.sessionID },
          });
          const session = sessionRes?.data;
          const title = session?.title || "";

          if (title) {
            const memories = await loadMemories();
            const queryTokens = tokenize(title);

            if (queryTokens.length > 0 && memories.length > 0) {
              const scored = memories.map((entry) => {
                const lowerContent = entry.content.toLowerCase();
                const lowerTags = entry.tags.map((t) => t.toLowerCase());
                const contentTokens = tokenize(entry.content);
                const tagTokens = entry.tags.flatMap((t) => tokenize(t));

                let score = 0;
                let matchedTokens = 0;

                for (const token of queryTokens) {
                  let tokenMatched = false;
                  if (contentTokens.includes(token)) {
                    score += 25;
                    tokenMatched = true;
                  } else if (lowerContent.includes(token)) {
                    score += 15;
                    tokenMatched = true;
                  }
                  if (tagTokens.includes(token)) {
                    score += 20;
                    tokenMatched = true;
                  } else if (lowerTags.some((t) => t.includes(token))) {
                    score += 12;
                    tokenMatched = true;
                  }
                  if (tokenMatched) matchedTokens++;
                }

                const matchRatio = matchedTokens / queryTokens.length;
                if (matchRatio >= 0.8) score += 20;
                else if (matchRatio >= 0.5) score += 10;
                if (matchRatio < 0.25 && queryTokens.length > 1) {
                  score = Math.floor(score * 0.5);
                }

                return { entry, score };
              });

              const topMemories = scored
                .filter((s) => s.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((s) => s.entry);

              if (topMemories.length > 0) {
                output.context.push(
                  "## Relevant Past Learnings\n" +
                    topMemories.map((m) => `- ${m.content}`).join("\n") +
                    "\n\nUse memory_search if you need more specific or recent information.",
                );

                // Update access counts for injected memories
                for (const entry of topMemories) {
                  entry.access_count += 1;
                  entry.updated_at = new Date().toISOString();
                }
                await saveMemories(memories);
              }
            }
          }
        } catch {
          // Graceful fallback: if session fetch fails, do nothing
        }
      },
      event: async ({
        event,
      }: {
        event: { type: string; sessionID?: string; error?: unknown };
      }) => {
        // Async reflection — fire and forget so session events aren't blocked
        if (
          (event.type === "session.compacted" ||
            event.type === "session.idle") &&
          event.sessionID
        ) {
          runReflection(client, event.sessionID).catch((error) => {
            logError(`Reflection on ${event.type} failed:`, error);
          });
        }

        // Failure learning: save anti-pattern when sessions error
        if (event.type === "session.error") {
          const errorMsg =
            event.error instanceof Error
              ? event.error.message
              : typeof event.error === "string"
                ? event.error
                : JSON.stringify(event.error);
          try {
            await addMemory(`Session error occurred: ${errorMsg}`, [
              "learning-loop",
              "error",
              "anti-pattern",
            ]);
          } catch (err) {
            logError("Failed to save error memory:", err);
          }
        }
      },
      tool: {
        memory_save: memorySaveTool,
        memory_search: memorySearchTool,
        memory_list: memoryListTool,
        memory_delete: memoryDeleteTool,
        memory_sync: memorySyncTool,
      },
    };
  } catch (error) {
    logError("Plugin initialization failed:", error);
    return {};
  }
};

export const id = "learning-loop";

export default {
  id,
  server: LearningLoopPlugin,
};
