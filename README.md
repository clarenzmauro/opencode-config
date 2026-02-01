# OpenCode Config

This is a configuration template for running OpenCode as a server on your Tailscale network.

## Setup

### 1. Installation

Install dependencies:

```bash
bun install
```

### 2. Configure

1. Copy this config to your machine
2. Update `credentials/server_password` with your desired password (replace `{ADD_YOUR_PASSWORD_HERE}`)
3. Configure your models in `config.json` as needed

### 3. Run OpenCode Server

To start the OpenCode server on your Tailscale network:

```bash
opencode serve --hostname 0.0.0.0 --port 2127
```

### 4. Access from Tailscale Network

Once the server is running, you can access it from any device on your Tailscale network by connecting to:
- `http://<tailscale-ip>:2127`

## Using as Template

To set up OpenCode on another machine:

1. Clone or copy this configuration
2. Update `credentials/server_password` with a unique password
3. Configure models in `config.json` for that specific machine
4. Run the server with the command above

## Project Structure

- `config.json` - OpenCode configuration including models and plugins
- `credentials/server_password` - Server authentication password template
- `agents/` - Custom agents
- `skills/` - Custom skills

This project was created using `bun init` in bun v1.2.16. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
