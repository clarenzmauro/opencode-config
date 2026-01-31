# OpenCode Config

Your personal OpenCode configuration setup with custom agents and skills.

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

- **config.json** - Main configuration with:
  - Plugin: `opencode-google-antigravity-auth`
  - Provider: Google AI with high-thinking models
    - Gemini 3 Pro Preview
    - Gemini 3 Flash
    - Claude Sonnet 4.5
    - Claude Opus 4.5
  - Formatter: Prettier for JS/TS/JSX/TSX/JSON/CSS

### Custom Agents

- **Build** (default) - Blue - Full development access
- **Plan** - Purple - Read-only analysis and planning
- **Understand** - Bright green (#22c55e) - Teaching assistant

**Understand Agent:**
- Read-only mode for teaching and learning
- Focuses on concepts, explanations, and hints
- Never generates complete solutions
- Perfect for learning new concepts or debugging strategies

### Skills

- **frontend-design** - Creates distinctive, production-grade frontend interfaces
  - Avoids generic AI aesthetics
  - Bold, memorable design choices
  - Exceptional attention to visual details

## Usage

Once set up, press **Tab** to cycle through agents:
- Build → Plan → Understand → Build

The "Understand" agent will appear in the lower-right corner with a **bright green indicator**.

## Manual Setup

If the automated setup guidance doesn't work, you can manually copy files:

1. **config.json** → `~/.config/opencode/config.json`
2. **agents/understand.md** → `~/.config/opencode/agents/understand.md`
3. **skills/frontend-design/SKILL.md** → `~/.config/opencode/skills/frontend-design/SKILL.md`

Then restart OpenCode.

## Updating

To update your configuration:
1. Tell OpenCode: "Setup my opencode using https://github.com/clarenzmauro/opencode-config"
2. Agent will guide you through updating changed files

## License

MIT License - Feel free to use and modify for your own setup.
