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
- Strategic sampling across all modules
- Follow dependencies outward from key areas
- Prioritize architecture patterns and data flow

### Test Coverage (Required)
- Understand ALL tests: infrastructure, patterns, behaviors, edge cases, integrations

### Data Flow Principle
- **Input → Processing → Output**
- Trace system-wide, identify all touchpoints

### Before Implementing
✓ Read codebase (or adaptive sample)
✓ Understand architecture & patterns
✓ Review all tests
→ Proceed unless uncertain
→ Ask questions if unclear

## Code Style
- Prioritize human-readability and simplicity
- Write clean, straightforward code
- Follow existing patterns, don't enforce new ones
- Avoid over-engineering
- Keep functions focused and concise

## Testing
- Required for ALL changes (features and bug fixes)
- Use existing test frameworks
- Ensure new tests pass before review
- Run full test suite for significant changes

## Architecture
- Follow: SOLID, DRY, separation of concerns
- Respect existing structure and patterns
- Maintain consistency with established decisions
- Consider maintainability and extensibility

## Commit Workflow
1. **Before showing changes**: Run full validation (syntax, typecheck, lint)
2. **Present**: Show changes for manual review WITHOUT committing
3. **Wait**: Get explicit approval
4. **Commit**: Only after user approval

## Self-Documentation

### What to Document
After exploring codebase, document EVERY new pattern, convention, or decision:
- Project structure: organization, boundaries, entry points
- Code conventions: naming, formatting, comments
- Architecture patterns: designs, decisions, relationships
- Library usage: common libs, integrations, patterns
- Config patterns: env vars, config files, build scripts

### Documentation Workflow
1. **Discover**: Note undocumented patterns while reading
2. **Propose**: Show additions with context and rationale
3. **Approve**: Wait for EXPLICIT user approval
4. **Update**: Add as simple bullets in relevant sections
5. **Reference**: Use documented patterns in future tasks

### Formatting
- Simple bullet points only
- Place in most relevant section
- Be specific, include examples when helpful
- Keep concise but informative

### CRITICAL
- **NEVER edit this file without explicit user approval**
- Always show proposed changes and explain why
- User must confirm before updating
