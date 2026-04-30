---
name: memory
description: Persistent memory and learning loop integration. Use this to recall user preferences and past learnings.
---

## Usage Guidelines

1. **Start of every task**: Call `memory_search` with relevant keywords about the current task to recall prior context, preferences, or related learnings.
2. **User preferences & facts**: When the user states a preference, requirement, or important fact, call `memory_save` immediately to persist it.
3. **Complex workflows**: After completing a complex multi-step workflow, the learning loop will automatically reflect and create skills. You may also manually save key insights via `memory_save` if reflection hasn't triggered yet.

## Available Tools

- `memory_save` — Store a new memory entry.
- `memory_search` — Retrieve memories by keywords or semantic similarity.
- `memory_list` — List recent or matching memory entries.
- `memory_delete` — Remove a memory entry by ID.
