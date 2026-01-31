# OpenCode Config

Your personal OpenCode configuration setup with custom agents.

## Quick Setup

Tell OpenCode:
> Setup my opencode using https://github.com/clarenzmauro/opencode-config

This will guide you through the setup process.

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Clone this repository

```bash
git clone https://github.com/clarenzmauro/opencode-config.git ~/.config/opencode-shared
```

### 2. Configure OpenCode to use these settings

Set the environment variable to tell OpenCode where to find your shared configuration:

```bash
export OPENCODE_CONFIG_DIR=~/.config/opencode-shared
```

### 3. Make it permanent (optional)

Add the export line to your shell profile:

**For bash:** `~/.bashrc`
**For zsh:** `~/.zshrc`
**For fish:** `~/.config/fish/config.fish`

```bash
echo 'export OPENCODE_CONFIG_DIR=~/.config/opencode-shared' >> ~/.zshrc
```

### 4. Restart OpenCode

Restart OpenCode or your terminal to apply the changes.

## What's Included

### Custom Agents

- **Build** (default) - Blue - Full development access
- **Plan** - Purple - Read-only analysis and planning
- **Understand** - Bright green (#22c55e) - Teaching assistant

**Understand Agent:**
- Read-only mode for teaching and learning
- Focuses on concepts, explanations, and hints
- Never generates complete solutions
- Perfect for learning new concepts or debugging strategies

### Configuration

- Main opencode.json settings
- Custom agent definitions
- Theme and visual preferences

## Usage

Once set up, press **Tab** to cycle through agents:
- Build → Plan → Understand → Build

The "Understand" agent will appear in the lower-right corner with a **bright green indicator**.

## Updating

To update your configuration, pull the latest changes:

```bash
cd ~/.config/opencode-shared
git pull
```

Then restart OpenCode.

## License

MIT License - Feel free to use and modify for your own setup.
