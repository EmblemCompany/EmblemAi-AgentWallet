# @emblemvault/agentwallet

The CLI for **EmblemVault Agent Wallet** -- giving AI agents their own crypto wallets across 7 blockchains. Designed for use in [OpenClaw](https://openclaw.ai), autonomous agent frameworks, and any system where AI agents need to hold, send, and manage crypto independently.

Each agent gets a deterministic wallet derived from a password. No seed phrases, no manual key management. The agent authenticates once and gets addresses on Solana, Ethereum, Base, BSC, Polygon, Hedera, and Bitcoin -- ready to trade, hold, and transact.

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Quick Start

```bash
# Agent mode -- give your AI agent a wallet (auto-generates credentials on first run)
emblemai --agent -m "What are my wallet addresses?"

# Agent mode with a specific wallet identity
emblemai --agent -p "my-agent-password-here" -m "Show my balances across all chains"

# Interactive mode -- opens browser for human authentication
emblemai
```

## Authentication

EmblemAI v3 supports two authentication methods:

### Browser Auth (Interactive Mode)

When you run `emblemai` without `-p`, the CLI:

1. Checks for a saved session in `~/.emblemai/session.json`
2. If no valid session, opens your browser to authenticate via the EmblemVault auth modal
3. Captures the JWT session and saves it locally
4. On subsequent runs, restores the saved session automatically (no login needed until it expires)

If the browser fails to open, the URL is printed for manual copy-paste. If authentication times out (5 minutes), falls back to password prompt.

### Password Auth (Agent Mode)

Agent mode always uses password authentication:

- Auto-generates a secure password on first run if none provided
- Password is stored encrypted via dotenvx in `~/.emblemai/.env`
- Use `-p` flag to provide a specific password

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses return the same vault. Different passwords produce different wallets.

- Password must be 16+ characters
- No recovery if lost (treat it like a private key)

## Operating Modes

### Interactive Mode (Default)

Readline-based interactive mode with streaming AI responses, glow markdown rendering, and slash commands.

```bash
emblemai              # Browser auth (recommended)
emblemai -p "your-password"  # Password auth
```

### Agent Mode

Agent mode is the primary integration point for AI agents, automation scripts, and agent frameworks like OpenClaw. It sends a single message, prints the response to stdout, and exits -- designed for programmatic use where another system is orchestrating the agent.

**Zero-config setup**: On first run without a password, agent mode auto-generates a secure password and stores it encrypted. The agent gets a wallet immediately with no human intervention.

```bash
# First run -- auto-generates password, creates wallet, answers query
emblemai --agent -m "What are my wallet addresses?"

# Explicit password -- use when you need a specific wallet identity
emblemai --agent -p "your-password" -m "Show my balances"

# Pipe output to other tools
emblemai -a -m "What is my SOL balance?" | jq .

# Use in scripts
ADDRESSES=$(emblemai -a -m "List my addresses as JSON")
```

Agent mode always uses password auth (never browser auth), retains conversation history between calls, and supports the full Hustle AI toolset including trading, transfers, portfolio queries, and cross-chain operations.

#### Integrating with Agent Frameworks

Any system that can shell out to a CLI can give its agents a wallet:

```bash
# OpenClaw, CrewAI, AutoGPT, or any agent framework
emblemai --agent -m "Send 0.1 SOL to <address>"
emblemai --agent -m "Swap 100 USDC to ETH on Base"
emblemai --agent -m "What tokens do I hold across all chains?"
```

Each password produces a unique, deterministic wallet. To give multiple agents separate wallets, use different passwords:

```bash
emblemai --agent -p "agent-alice-wallet-001" -m "My addresses?"
emblemai --agent -p "agent-bob-wallet-002" -m "My addresses?"
```

### Reset Conversation

```bash
emblemai --reset
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `-p`, `--password <pw>` | EmblemVault password (min 16 chars) -- skips browser auth |
| `-m`, `--message <msg>` | Message to send (agent mode) |
| `-a`, `--agent` | Agent mode (single message, exit) |
| `--restore-auth <path>` | Restore credentials from a backup file and exit |
| `--debug` | Enable debug output |
| `--stream` | Toggle streaming (default: on) |
| `--log` | Enable stream logging |
| `--log-file <path>` | Override log file path |
| `--reset` | Clear conversation history |
| `--hustle-url <url>` | Override Hustle API endpoint |
| `--auth-url <url>` | Override auth endpoint |
| `--api-url <url>` | Override API endpoint |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBLEM_PASSWORD` | Password (alternative to `-p`) |
| `HUSTLE_API_URL` | Hustle API endpoint override |
| `EMBLEM_AUTH_URL` | Auth endpoint override |
| `EMBLEM_API_URL` | API endpoint override |
| `ELIZA_URL` | ElizaOS URL for inverse discovery |

## Interactive Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/plugins` | List all plugins with status |
| `/plugin <name> on\|off` | Toggle a plugin |
| `/tools` | List available tools |
| `/tools add\|remove <id>` | Manage tool selection |
| `/tools clear` | Enable auto-tools mode |
| `/auth` | Authentication menu (session info, addresses, backup, logout) |
| `/wallet` | Show wallet addresses |
| `/portfolio` | Show portfolio |
| `/settings` | Show current settings |
| `/model <id>` | Set AI model (or `clear` to reset) |
| `/stream on\|off` | Toggle streaming |
| `/debug on\|off` | Toggle debug mode |
| `/history on\|off` | Toggle history retention |
| `/payment` | PAYG billing status |
| `/payment enable\|disable` | Toggle PAYG billing |
| `/payment token <T>` | Set payment token |
| `/payment mode <M>` | Set payment mode |
| `/secrets` | Manage encrypted plugin secrets |
| `/glow on\|off` | Toggle glow markdown rendering |
| `/log on\|off` | Toggle stream logging |
| `/reset` | Clear conversation |
| `/exit` | Exit |

## Auth Backup and Restore

The `/auth` menu includes a **Backup Agent Auth** option that exports your credentials to a single JSON file. To restore on another machine:

```bash
emblemai --restore-auth ~/emblemai-auth-backup.json
```

This places the credential files in `~/.emblemai/` and you're ready to go.

## Plugins

The ElizaOS plugin is loaded by default:

| Plugin | Package | Description |
|--------|---------|-------------|
| ElizaOS | `@agenthustle/plugin-masq` | ElizaOS agent framework with MASQ and inverse discovery |

Additional plugins exist but are currently disabled. See [docs/PLUGINS.md](docs/PLUGINS.md) for details.

## Optional: Glow (Markdown Rendering)

Install [glow](https://github.com/charmbracelet/glow) for rich markdown rendering in AI responses:

```bash
brew install glow    # macOS
sudo snap install glow  # Linux
```

Toggle with `/glow on|off`.

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Documentation

- [Setup Guide](docs/SETUP.md) -- installation, auth, running modes
- [Commands](docs/COMMANDS.md) -- full command reference
- [Plugins](docs/PLUGINS.md) -- plugin system and tool reference

## Links

- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
