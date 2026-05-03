- For JavaScript/TypeScript and web development projects, always use `bun` (e.g., `bun install` or `bun run build`).
- Organize code into deep modules (e.g., `/auth/`) with strict public boundaries.
- Write a test that fails first, then make it pass. Loop until success.
- Ensure build, lint, and type check tools are always set up and usable for fast error feedback loops.
- 1 function = 1 responsibility.
- If a confusion is solved, list the fix here in this file to prevent it from happening again.

## Fixed Confusions

**2026-04-30 — memory_sync push rejected (non-fast-forward)**
- Problem: `memory_sync` failed with "rejected: main -> main (non-fast-forward)" because local branch diverged from remote.
- Root cause: Multiple auto-sync commits on local and remote caused branches to diverge.
- Fix: `git stash && git fetch origin && git reset --hard origin/main && git stash pop`, then resolve any merge conflicts (for JSONL files, remove `<<<<<<< / ======= / >>>>>>>` markers and keep both line sets), then commit and push.
- Prevention: When syncing memories manually, always ensure local branch is rebased onto remote before pushing. For auto-sync tools, handle divergence by resetting to remote and re-applying local changes.

**2026-04-30 — memory_sync output overlaps Ghostty TUI**
- Problem: Auto-sync git commands (init, fetch, commit, push) printed stdout directly to the terminal, overlapping with the OpenCode TUI interface.
- Root cause: Bun shell `$` commands in `learning-loop.ts` default to printing stdout. No `.quiet()` was set on git commands.
- Fix: Added `.quiet()` to all git commands in `learning-loop.ts` that do not need to return output: `git init`, `git remote add`, `git config`, `git fetch`, `git add`, `git commit`, `git push`.
- Prevention: Any new shell command added to the learning-loop plugin that runs in the background must use `.quiet()` to prevent TUI corruption.
