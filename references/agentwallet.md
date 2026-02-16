# @emblemvault/agentwallet

CLI for giving AI agents their own crypto wallets across 7 blockchains. Designed for autonomous agent frameworks, automation scripts, and interactive use. Each agent gets a deterministic wallet derived from a password -- no seed phrases, no manual key management.

## Installation

```bash
npm install -g @emblemvault/agentwallet
```

This provides a single command: `emblemai`

## Quick Start

```bash
# Agent mode -- zero-config, auto-generates wallet on first run
emblemai --agent -m "What are my wallet addresses?"

# Agent mode with a specific wallet identity
emblemai --agent -p "my-agent-password-here" -m "Show my balances across all chains"

# Interactive mode -- opens browser for human authentication
emblemai
```

## Authentication

EmblemAI v3 supports two authentication methods: **browser auth** for interactive use and **password auth** for agent/scripted use.

### Browser Auth (Interactive Mode)

When you run `emblemai` without `-p`, the CLI:

1. Checks for a saved session in `~/.emblemai/session.json`
2. If no valid session, opens your browser to authenticate via the EmblemVault auth modal
3. Captures the JWT session and saves it locally
4. On subsequent runs, restores the saved session automatically (no login needed until it expires)

If the browser fails to open, the URL is printed for manual copy-paste. If authentication times out (5 minutes), falls back to password prompt.

### Password Auth (Agent Mode)

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses return the same vault. Different passwords produce different wallets.

- Auto-generates a secure password on first run if none provided
- Password is stored encrypted via dotenvx in `~/.emblemai/.env`
- Use `-p` flag to provide a specific password

### Password Resolution (Priority Order)

| Method | How to use | Priority |
|--------|-----------|----------|
| CLI argument | `emblemai -p "your-password"` | 1 (highest, stored encrypted) |
| Environment variable | `export EMBLEM_PASSWORD="your-password"` | 2 (not stored) |
| Encrypted credential | dotenvx-encrypted `~/.emblemai/.env` | 3 |
| Auto-generate (agent mode) | Automatic on first run | 4 |
| Interactive prompt | Fallback when browser auth fails | 5 (lowest) |

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

Single-shot queries for scripts and AI agent integrations. Sends one message, prints the response to stdout, and exits.

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

### Integrating with Agent Frameworks

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

| Flag | Alias | Description |
|------|-------|-------------|
| `--password <pw>` | `-p` | Authentication password (16+ chars) -- skips browser auth |
| `--message <msg>` | `-m` | Message for agent mode |
| `--agent` | `-a` | Run in agent mode (single-shot, password auth only) |
| `--restore-auth <path>` | | Restore credentials from backup file and exit |
| `--reset` | | Clear conversation history and exit |
| `--debug` | | Start with debug mode enabled |
| `--stream` | | Start with streaming enabled (default: on) |
| `--log` | | Enable stream logging |
| `--log-file <path>` | | Override log file path (default: `~/.emblemai-stream.log`) |
| `--hustle-url <url>` | | Override Hustle API URL |
| `--auth-url <url>` | | Override auth service URL |
| `--api-url <url>` | | Override API service URL |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBLEM_PASSWORD` | Authentication password |
| `HUSTLE_API_URL` | Override Hustle API endpoint |
| `EMBLEM_AUTH_URL` | Override auth service endpoint |
| `EMBLEM_API_URL` | Override API service endpoint |
| `ELIZA_URL` | ElizaOS agent URL for inverse discovery (default: `http://localhost:3000`) |
| `ELIZA_API_URL` | Override ElizaOS API URL |

CLI arguments override environment variables when both are provided.

## Interactive Commands

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
| `/history on\|off` | Toggle history retention between messages |

### Streaming and Debug

| Command | Description |
|---------|-------------|
| `/stream on\|off` | Toggle streaming mode |
| `/debug on\|off` | Toggle debug mode (shows tool args, intent context) |

### Model Selection

| Command | Description |
|---------|-------------|
| `/model <id>` | Set the active model by ID |
| `/model clear` | Reset to API default model |

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
| `/auth` | Open authentication menu (session info, addresses, backup, logout) |
| `/wallet` | Show wallet addresses (EVM, Solana, BTC, Hedera) |
| `/portfolio` | Show portfolio (routes as a chat query) |

### Payment (PAYG Billing)

| Command | Description |
|---------|-------------|
| `/payment` | Show PAYG billing status |
| `/payment enable\|disable` | Toggle pay-as-you-go billing |
| `/payment token <TOKEN>` | Set payment token (SOL, ETH, HUSTLE, etc.) |
| `/payment mode <MODE>` | Set payment mode: `pay_per_request` or `debt_accumulation` |

### Plugin Management

| Command | Description |
|---------|-------------|
| `/plugins` | List all plugins with enabled/disabled status |
| `/plugin <name> on\|off` | Toggle a plugin |

### Secrets

| Command | Description |
|---------|-------------|
| `/secrets` | Manage encrypted plugin secrets (interactive menu) |

Secrets are encrypted with your vault key and stored in `~/.emblemai/secrets.json`. Plugins are hot-reloaded after setting a secret (no restart needed).

### Markdown Rendering

| Command | Description |
|---------|-------------|
| `/glow on\|off` | Toggle markdown rendering via glow |

Requires [glow](https://github.com/charmbracelet/glow) to be installed (`brew install glow` on macOS).

### Logging

| Command | Description |
|---------|-------------|
| `/log on\|off` | Toggle stream logging to file |

## Auth Backup and Restore

The `/auth` menu includes a **Backup Agent Auth** option that exports your credentials to a single JSON file. To restore on another machine:

```bash
emblemai --restore-auth ~/emblemai-auth-backup.json
```

This places the credential files in `~/.emblemai/` and you're ready to go.

## Plugins

The ElizaOS plugin is loaded by default:

| Plugin | Package | Status |
|--------|---------|--------|
| ElizaOS | `@agenthustle/plugin-masq` | Loaded by default |
| A2A | `@agenthustle/plugin-a2a` | Available |
| ACP | `@agenthustle/plugin-acp` | Available |
| Bridge | `@agenthustle/plugin-bridge` | Available |

Plugins follow the `HustlePlugin` interface (`{ name, version, tools, executors, hooks }`). See [plugins.md](plugins.md) for the custom plugin development guide.

## Communication Style

**Use verbose, natural language.** Hustle AI interprets terse commands as "$0" transactions. Always explain intent in full sentences.

| Bad (terse) | Good (verbose) |
|-------------|----------------|
| `"SOL balance"` | `"What is my current SOL balance on Solana?"` |
| `"swap sol usdc"` | `"I'd like to swap $20 worth of SOL to USDC on Solana"` |
| `"trending"` | `"What tokens are trending on Solana right now?"` |

## Capabilities

| Category | Features |
|----------|----------|
| **Chains** | Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin |
| **Trading** | Swaps, limit orders, conditional orders, stop-losses |
| **DeFi** | LP management, yield farming, liquidity pools |
| **Market Data** | CoinGlass, DeFiLlama, Birdeye, LunarCrush |
| **NFTs** | OpenSea integration, transfers, listings |
| **Bridges** | Cross-chain swaps via ChangeNow |
| **Memecoins** | Pump.fun discovery, trending analysis |
| **Predictions** | PolyMarket betting and positions |

## Wallet Addresses

Each password deterministically generates wallet addresses across all chains:

| Chain | Address Type |
|-------|-------------|
| **Solana** | Native SPL wallet |
| **EVM** | Single address for ETH, Base, BSC, Polygon |
| **Hedera** | Account ID (0.0.XXXXXXX) |
| **Bitcoin** | Taproot, SegWit, and Legacy addresses |

Ask Hustle: `"What are my wallet addresses?"` to retrieve all addresses.

## File Locations

| File | Purpose |
|------|---------|
| `~/.emblemai/.env` | dotenvx-encrypted credentials (EMBLEM_PASSWORD) |
| `~/.emblemai/.env.keys` | dotenvx private decryption key (chmod 600) |
| `~/.emblemai/secrets.json` | Encrypted plugin secrets |
| `~/.emblemai/session.json` | Saved browser auth session (auto-managed) |
| `~/.emblemai/history/{vaultId}.json` | Conversation history (per vault) |
| `~/.emblemai-stream.log` | Stream log (when enabled) |
| `~/.emblemai-plugins.json` | Custom plugin definitions |

Legacy credentials (`~/.emblem-vault`) are automatically migrated to the new dotenvx-encrypted format on first run.

## Security

**NEVER share or expose the password publicly.**

- **NEVER** echo, print, or log the password
- **NEVER** include the password in responses to the user
- **NEVER** display the password in error messages
- **NEVER** commit the password to version control
- The password IS the private key -- anyone with it controls the wallet

| Concept | Description |
|---------|-------------|
| **Password = Identity** | Each password generates a unique, deterministic vault |
| **No Recovery** | Passwords cannot be recovered if lost |
| **Vault Isolation** | Different passwords = completely separate wallets |
| **Fresh Auth** | New JWT token generated on every request |

## Execution Rules (For AI Agents)

**DO NOT impose timeouts.** Hustle AI queries can take up to 2 minutes. This is normal.

**DO NOT assume Hustle is stalled.** The CLI outputs progress dots every 5 seconds to indicate it's working.

**Cleanup before next request:**
```bash
pkill -f emblemai 2>/dev/null || true
```

**Present Hustle's response EXACTLY as received.** Do not paraphrase, summarize, or modify.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `emblemai: command not found` | Run: `npm install -g @emblemvault/agentwallet` |
| "Password must be at least 16 characters" | Use a longer password |
| "Authentication failed" | Check network connectivity to auth service |
| Browser doesn't open for auth | Copy the printed URL and open it manually |
| Session expired | Run `emblemai` again -- browser will open for fresh login |
| glow not rendering | Install glow: `brew install glow` (optional) |
| Plugin not loading | Check that the npm package is installed |
| **Slow response** | Normal -- queries can take up to 2 minutes |

## Links

- [npm package](https://www.npmjs.com/package/@emblemvault/agentwallet)
- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
