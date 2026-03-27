# OpenCode Config

Your personal OpenCode configuration setup with custom skills.

## Quick Setup

Tell OpenCode:
> Setup my opencode using https://github.com/clarenzmauro/opencode-config

The agent will guide you through the setup process by reading configuration files from this repository and providing step-by-step instructions.

## How It Works

1. OpenCode agent reads configuration files from this GitHub repository
2. Agent provides you with clear instructions for each file
3. You copy/create files as instructed to your `~/.config/opencode/` directory
4. No git cloning required - just copy and paste!

## What's Included

### Configuration Files

- **config.json** - Main configuration with formatter (Prettier for JS/TS/JSX/TSX/JSON/CSS)

- **credentials/server_password** - Server authentication password template

- **AGENTS.md** - Global agent guidelines defining:
  - **Package Manager**: Use Bun instead of npm/pnpm/yarn
  - **Error Checking**: Use build, lint, test commands instead of running the project
  - **Test-Driven Development**: Strictly one test at a time using red-green-refactor
  - **Thoroughness**: Be thorough with understanding the task and codebase
  - **Module Organization**: Deep modules with strict public boundaries (e.g., `/auth/`)
  - **Communication**: Keep talk short using simple words
  - **Confusion Handling**: Alert developer when confused, document learnings in project AGENTS.md

### Skills

- **frontend-design** - Creates distinctive, production-grade frontend interfaces
  - Avoids generic AI aesthetics
  - Bold, memorable design choices
  - Exceptional attention to visual details

## Tailscale Server Setup

This configuration can be used to run OpenCode as a server on your Tailscale network.

### Installation

Install dependencies:

```bash
bun install
```

### Configure

1. Copy this config to your machine
2. Update `credentials/server_password` with your desired password (replace `{ADD_YOUR_PASSWORD_HERE}`)
3. Configure your models in `config.json` as needed

### Run OpenCode Server

To start the OpenCode server on your Tailscale network:

```bash
opencode serve --hostname 0.0.0.0 --port 2127
```

### Access from Tailscale Network

Once the server is running, you can access it from any device on your Tailscale network by connecting to:
- `http://<tailscale-ip>:2127`

### Using as Template

To set up OpenCode on another machine:

1. Clone or copy this configuration
2. Update `credentials/server_password` with a unique password
3. Configure models in `config.json` for that specific machine
4. Run the server with the command above

## Manual Setup

If automated setup guidance doesn't work, you can manually copy files:

1. **config.json** → `~/.config/opencode/config.json`
2. **AGENTS.md** → `~/.config/opencode/AGENTS.md`
3. **skills/frontend-design/SKILL.md** → `~/.config/opencode/skills/frontend-design/SKILL.md`
4. **credentials/server_password** → `~/.config/opencode/credentials/server_password`

**Note**: MEMORY.md is created per-project by the agent as needed (not part of global setup).

Restart OpenCode to apply changes.

## Updating

To update your configuration:
1. Tell OpenCode: "Setup my opencode using https://github.com/clarenzmauro/opencode-config"
2. Agent will guide you through updating changed files

## OpenCode Documentation

For general OpenCode questions or troubleshooting: https://opencode.ai/docs

## License

MIT License - Feel free to use and modify for your own setup.
