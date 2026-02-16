# EmblemAI Plugin Reference

EmblemAI uses a plugin system to extend AI capabilities with client-side tools. Plugins are loaded at startup and register tools that the AI can call during conversations.

---

## Active Plugin

### ElizaOS -- AI Agent Framework

**Package**: `@agenthustle/plugin-masq`
**Status**: Loaded by default
**Description**: Connects Hustle to the ElizaOS agent framework. Provides MASQ mode (HTTP server on port 3001) and inverse discovery to discover and register ElizaOS actions as client tools.

#### Configuration

The plugin is auto-configured at startup with:

- **MASQ**: Enabled on port 3001 -- exposes Hustle as an ElizaOS-compatible HTTP agent
- **Inverse discovery**: Enabled -- discovers actions from a running ElizaOS instance and registers them as client tools
- **Hustle client**: Wired automatically for inverse control (ElizaOS actions route through `hustleClient.chat()`)

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ELIZA_URL` | ElizaOS agent URL for inverse discovery | `http://localhost:3000` |
| `ELIZA_API_URL` | ElizaOS API URL (via `--eliza-url` flag) | -- |

---

## Available Plugins (Not Loaded)

The following plugins exist as packages but are currently disabled in the plugin loader. They can be re-enabled in `src/plugins/loader.js` by uncommenting their specs.

| Plugin | Package | Description |
|--------|---------|-------------|
| A2A | `@agenthustle/plugin-a2a` | Google Agent-to-Agent protocol v0.3.0 (discovery, messaging, tasks) |
| ACP | `@agenthustle/plugin-acp` | Virtuals Agent Commerce Protocol (marketplace, jobs, autonomous mode) |
| Bridge | `@agenthustle/plugin-bridge` | Cross-protocol message router (A2A, ACP, ElizaOS) |

---

## Plugin Management

### Commands

```
/plugins                    # List all plugins and their status
/plugin <name> on           # Enable a plugin
/plugin <name> off          # Disable a plugin
```

### Tool Selection

```
/tools                      # List all available tools
/tools add <id>             # Add a tool to the active set
/tools remove <id>          # Remove a tool from the active set
/tools clear                # Clear selection (enable auto-tools mode)
```

When no tools are explicitly selected, the AI uses **auto-tools mode**, dynamically selecting appropriate tools based on conversation context.

---

## Plugin Architecture

### Plugin Interface

Plugins follow the `HustlePlugin` interface:

```js
{
  name: 'plugin-name',
  version: '1.0.0',
  tools: [
    {
      name: 'tool_name',
      description: 'What the tool does',
      parameters: { type: 'object', properties: { ... } },
    },
  ],
  executors: {
    tool_name: async (args) => { /* implementation */ },
  },
}
```

### Loading

Plugins are loaded in `src/plugins/loader.js` via `PluginManager.loadAll()`. Each plugin spec declares:

- `mod` -- npm package name
- `factory` -- exported factory function name
- `configKey` -- key in the config object for per-plugin settings

Missing packages are silently skipped.

### Secrets

Plugins can declare secrets (e.g., API keys) that are encrypted with the user's vault key and stored in `~/.emblemai/secrets.json`. Secrets are lazily decrypted on first tool use. Use `/secrets` to manage them interactively.

### Custom Plugins

User-created plugins are stored in `~/.emblemai-plugins.json` and loaded at startup. Custom plugins use serialized executor code that is compiled at load time.
