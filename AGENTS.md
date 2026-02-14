# Global OpenCode Rules

## Package Manager
Always use Bun instead of npm/pnpm/yarn:
| Command | Replace with |
|---------|--------------|
| `npm install` | `bun install` |
| `npm install <pkg>` | `bun add <pkg>` |
| `npm uninstall <pkg>` | `bun remove <pkg>` |
| `npm run <script>` | `bun run <script>` |
| `npm update <pkg>` | `bun update <pkg>` |
| `npm test` | `bun test` |
| Bundle | `bun build` |
| Init project | `bun init` |
| Create project | `bun create <template>` |

## Code Understanding

### Read Everything First
- **Default**: Read every file in the codebase
- **Goal**: Understand architecture, patterns, data flow at appropriate depth per area

### Large Codebases (Adaptive)
- Strategic sampling across all modules, follow dependencies outward from key areas, prioritize architecture patterns and data flow

### Test Coverage (Required)
- Understand ALL tests: infrastructure, patterns, behaviors, edge cases, integrations

### Data Flow Principle
- **Input → Processing → Output**: Trace system-wide, identify all touchpoints

### Before Implementing
✓ Read codebase (or adaptive sample), understand architecture & patterns, review all tests
→ Proceed unless uncertain, ask questions if unclear

## Code Quality
- Human-readable, simple code following existing patterns
- Tests required for ALL changes, use existing frameworks
- Follow SOLID, DRY, separation of concerns
- Respect existing structure, maintain consistency, avoid over-engineering, keep functions focused

## Commit Workflow
1. **Before showing changes**: Run full validation (syntax, typecheck, lint)
2. **Present**: Show changes for manual review WITHOUT committing
3. **Wait**: Get explicit approval
4. **Commit**: Only after user approval

## Self-Documentation

### What to Document
After exploring codebase, document EVERY new pattern, convention, or decision:
- Project structure (organization, boundaries, entry points)
- Code conventions (naming, formatting, comments)
- Architecture patterns (designs, decisions, relationships)
- Library usage (common libs, integrations, patterns)
- Config patterns (env vars, config files, build scripts)

### Workflow
1. **Discover**: Note undocumented patterns while reading
2. **Propose**: Show additions with context and rationale
3. **Approve**: Wait for EXPLICIT user approval
4. **Update**: Add as simple bullets in relevant sections

### Formatting & Critical Rules
- Simple bullets in most relevant section, be specific, concise
- **Target**: Document in **local project's AGENTS.md**, not this file
- **NEVER edit any AGENTS.md without explicit user approval**
- Always show proposed changes and explain why
- User must confirm before updating

## Memory Files

### Purpose
Track actions, decisions, and learnings across sessions to maintain continuity

### File Location
One MEMORY.md file per project, stored in project root

### Agent Workflow
1. **Start**: Read MEMORY.md before beginning work
2. **During**: Reference as needed during task execution
3. **After**: Auto-update after each task completion
4. **Session End**: Update with key learnings and insights

### MEMORY.md Template

```markdown
# Project Memory

## Project Overview
[Concise: Purpose, tech stack, key components, data flow]

## Task History
[YYYY-MM-DD] Task name - Brief outcome/status

## Decisions
[Date] Decision - Concise rationale

## Patterns Discovered
Pattern - Concise description + file reference

## File Changes
Action: path/to/file (concise reason)
```

### Conciseness Rules
- **Project Overview**: 2-4 sentences, update on significant changes
- **Task History**: One line per task, include date and status (✅/🔄/❌)
- **Decisions**: One line per decision, rationale in 1 sentence
- **Patterns Discovered**: One line per pattern, include file reference
- **File Changes**: One line per change, reason in 5-10 words

### Integration with AGENTS.md
- MEMORY.md tracks actions and learnings
- AGENTS.md documents patterns and conventions
- MEMORY.md findings inform AGENTS.md documentation proposals
- MEMORY.md: Auto-update (no approval needed)
- AGENTS.md: Requires explicit user approval
