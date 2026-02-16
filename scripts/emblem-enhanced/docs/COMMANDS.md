# EmblemAI Command Reference

## Slash Commands

All commands are prefixed with `/`. Type them in the input bar and press Enter.

### General

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/settings` | Show current configuration (vault ID, model, streaming, debug, tools) |
| `/exit` | Exit the CLI (also: `/quit`) |

### Chat and History

| Command | Description |
|---------|-------------|
| `/reset` | Clear conversation history and start fresh |
| `/clear` | Alias for `/reset` |
| `/history on` | Enable history retention between messages |
| `/history off` | Disable history retention (stateless mode) |
| `/history` | Show history status and recent messages |

### Streaming and Debug

| Command | Description |
|---------|-------------|
| `/stream on` | Enable streaming mode (tokens appear as generated) |
| `/stream off` | Disable streaming mode (wait for full response) |
| `/stream` | Show current streaming status |
| `/debug on` | Enable debug mode (shows tool args, intent context) |
| `/debug off` | Disable debug mode |
| `/debug` | Show current debug status |

### Model Selection

| Command | Description |
|---------|-------------|
| `/model <id>` | Set the active model by ID |
| `/model clear` | Reset to API default model |
| `/model` | Show currently selected model |

### Tool Management

| Command | Description |
|---------|-------------|
| `/tools` | List all tools with selection status |
| `/tools add <id>` | Add a tool to the active set |
| `/tools remove <id>` | Remove a tool from the active set |
| `/tools clear` | Clear tool selection (enable auto-tools mode) |

When no tools are selected, the AI operates in **auto-tools mode**, dynamically choosing appropriate tools based on conversation context.

### Authentication

| Command | Description |
|---------|-------------|
| `/auth` | Open authentication menu |
| `/wallet` | Show wallet addresses (EVM, Solana, BTC, Hedera) |
| `/portfolio` | Show portfolio (routes as a chat query) |

The `/auth` menu provides:

| Option | Description |
|--------|-------------|
| 1. Get API Key | Fetch your vault API key |
| 2. Get Vault Info | Show vault ID, addresses, creation date |
| 3. Session Info | Show current session details (identifier, expiry, auth type) |
| 4. Refresh Session | Refresh the auth session token |
| 5. EVM Address | Show your Ethereum/EVM address |
| 6. Solana Address | Show your Solana address |
| 7. BTC Addresses | Show your Bitcoin addresses (P2PKH, P2WPKH, P2TR) |
| 8. Backup Agent Auth | Export credentials to a backup file |
| 9. Logout | Clear session and exit (requires re-authentication on next run) |

### Payment (PAYG Billing)

| Command | Description |
|---------|-------------|
| `/payment` | Show PAYG billing status (enabled, mode, debt, tokens) |
| `/payment enable` | Enable pay-as-you-go billing |
| `/payment disable` | Disable pay-as-you-go billing |
| `/payment token <TOKEN>` | Set payment token (SOL, ETH, HUSTLE, etc.) |
| `/payment mode <MODE>` | Set payment mode: `pay_per_request` or `debt_accumulation` |

### Plugin Management

| Command | Description |
|---------|-------------|
| `/plugins` | List all plugins with enabled/disabled status |
| `/plugin <name> on` | Enable a plugin by name |
| `/plugin <name> off` | Disable a plugin by name |

### Secrets

| Command | Description |
|---------|-------------|
| `/secrets` | Manage encrypted plugin secrets (interactive menu) |

Secrets are encrypted with your vault key and stored in `~/.emblemai/secrets.json`. Plugins are hot-reloaded after setting a secret (no restart needed).

### Markdown Rendering

| Command | Description |
|---------|-------------|
| `/glow on` | Enable markdown rendering via glow |
| `/glow off` | Disable markdown rendering |
| `/glow` | Show glow status and version |

Requires [glow](https://github.com/charmbracelet/glow) to be installed.

### Logging

| Command | Description |
|---------|-------------|
| `/log on` | Enable stream logging to file |
| `/log off` | Disable stream logging |
| `/log` | Show logging status and file path |

Log file defaults to `~/.emblemai-stream.log`. Override with `--log-file <path>`.

## Keyboard Shortcuts

### Simple Mode (Default)

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Up` | Recall previous input |
| `Ctrl+C` | Exit |
| `Ctrl+D` | Exit (EOF) |

### TUI Mode

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Cycle focus between panels |
| `Enter` | Send message |
| `Ctrl+C` | Exit |
| `Up/Down` | Scroll panel content |
| Mouse scroll | Scroll in focused panel |

## Command Examples

### Session management

```
/settings
/auth
/wallet
/payment
/reset
```

### Tool and model management

```
/tools
/model gpt-4
/stream off
/debug on
```

### Plugin management

```
/plugins
/plugin hustle-elizaos on
/plugin hustle-elizaos off
```
