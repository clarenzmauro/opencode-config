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
  - **Plugin**: `opencode-google-antigravity-auth` - Google AI provider
    - Uses Google OAuth for authentication (no API key needed)
    - Requires `opencode auth login` with "OAuth with Google (Antigravity)" option
    - Supports multi-account load balancing for rate limit rotation
    - Models: Claude Opus 4.5, Claude Sonnet 4.5, Gemini 3 Pro, Gemini 3 Flash
  - **Formatter**: Prettier for JS/TS/JSX/TSX/JSON/CSS

- **credentials/server_password** - Server authentication password template

### Custom Agents

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

## Plugin Setup: opencode-google-antigravity-auth

This configuration uses the `opencode-google-antigravity-auth` plugin to access Google AI models.

### Prerequisites

- Node.js installed (https://nodejs.org/)
- Google account for OAuth authentication

### Setup Steps

1. **Install plugin** (already in config.json):
   ```json
   {
     "plugin": ["opencode-google-antigravity-auth"]
   }
   ```

2. **Authenticate with Google**:
   ```bash
   opencode auth login
   ```
   - Choose "OAuth with Google (Antigravity)" provider
   - Authenticate in browser that opens
   - Optional: Add multiple accounts for rate limit rotation

3. **Important Notes**:
   - Uses OAuth authentication (no Google API key required)
   - May violate Google's Terms of Service
   - Recommended: Use established Google account not needed for critical services
   - Safari users: Temporarily disable "HTTPS-Only Mode" during auth

For detailed setup guide: https://github.com/NoeFabris/opencode-antigravity-auth

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

## Usage

Once set up, press **Tab** to cycle through agents:
- Build → Plan → Understand → Build

The "Understand" agent will appear in the lower-right corner with a **bright green indicator**.

### Built-in Agents (OpenCode Default)
- **Build** (default) - Blue - Full development access
- **Plan** - Purple - Read-only analysis and planning

### Custom Agent
- **Understand** - Bright green (#22c55e) - Teaching assistant

## Manual Setup

If automated setup guidance doesn't work, you can manually copy files:

1. **config.json** → `~/.config/opencode/config.json`
2. **agents/understand.md** → `~/.config/opencode/agents/understand.md`
3. **skills/frontend-design/SKILL.md** → `~/.config/opencode/skills/frontend-design/SKILL.md`
4. **credentials/server_password** → `~/.config/opencode/credentials/server_password`

Then run:
```bash
opencode auth login
```
Choose "OAuth with Google (Antigravity)" to complete plugin setup.

Restart OpenCode to apply changes.

## Updating

To update your configuration:
1. Tell OpenCode: "Setup my opencode using https://github.com/clarenzmauro/opencode-config"
2. Agent will guide you through updating changed files

## OpenCode Documentation

For general OpenCode questions or troubleshooting: https://opencode.ai/docs

## License

MIT License - Feel free to use and modify for your own setup.
