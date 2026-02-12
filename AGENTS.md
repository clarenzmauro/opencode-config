# Global OpenCode Rules

## Package Manager
Use Bun instead of npm, pnpm, or yarn:
- `bun install` instead of `npm install`
- `bun add <pkg>` instead of `npm install <pkg>`
- `bun remove <pkg>` instead of `npm uninstall <pkg>`
- `bun run <script>` instead of `npm run <script>`
- `bun update <pkg>` instead of `npm update <pkg>`
- `bun test` instead of `npm test`
- `bun build` to bundle files
- `bun init` to initialize project
- `bun create <template>` to create new project

## Search Tools

### Content Search (search inside files)
Use **ripgrep (rg)** instead of `grep`:
- `rg "pattern"` instead of `grep "pattern"`
- `rg "pattern" ./src` instead of `grep -r "pattern" ./src`
- `rg -i "pattern"` for case-insensitive search
- `rg "pattern" --type js` to search only JavaScript files

### File Search (find files by name)
Use **fd** instead of `find`:
- `fd "pattern"` instead of `find . -name "*pattern*"`
- `fd -e "js"` for specific extension
- `fd -t d` for directories only
- `fd -t f` for files only
