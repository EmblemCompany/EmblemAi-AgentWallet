---
name: emblem-ai-agent-wallet
description: Connect to EmblemVault and manage crypto wallets via Emblem AI - Agent Hustle. Supports Solana, Ethereum, Base, BSC, Polygon, Hedera, and Bitcoin. Use when the user wants to trade crypto, check balances, swap tokens, or interact with blockchain wallets.
metadata:
  emoji: "🛡️"
  homepage: "https://emblemvault.dev"
  primaryEnv: "EMBLEM_PASSWORD"
  requires: "node, npm, emblemai"
  install: "npm install -g @emblemvault/agentwallet"
  author: "EmblemCompany"
  version: "3.0.2"

---

# Emblem Agent Wallet

Connect to **Agent Hustle** -- EmblemVault's autonomous crypto AI with 250+ trading tools across 7 blockchains. Browser auth, streaming responses, plugin system, and zero-config agent mode.

**Requires the CLI**: `npm install -g @emblemvault/agentwallet`

---

## Quick Start -- How to Use This Skill

**Step 1: Install the CLI**

```bash
npm install -g @emblemvault/agentwallet
```

This provides a single command: `emblemai`

**Step 2: Use it**

When this skill loads, you can ask Agent Hustle anything about crypto:

- "What are my wallet addresses?"
- "Show my balances across all chains"
- "What's trending on Solana?"
- "Swap $20 of SOL to USDC"
- "Send 0.1 ETH to 0x..."

**To invoke this skill, say things like:**
- "Use my Emblem wallet to check balances"
- "Ask Agent Hustle what tokens I have"
- "Connect to EmblemVault"
- "Check my crypto portfolio"

All requests are routed through `emblemai` under the hood.

---

## Prerequisites

- **Node.js** >= 18.0.0
- **Terminal** with 256-color support (iTerm2, Kitty, Windows Terminal, or any xterm-compatible terminal)
- **Optional**: [glow](https://github.com/charmbracelet/glow) for rich markdown rendering (`brew install glow` on macOS)

## Installation

### From npm (Recommended)

```bash
npm install -g @emblemvault/agentwallet
```

### From source

```bash
git clone https://github.com/EmblemCompany/EmblemAi-AgentWallet-Plugins.git
cd EmblemAi-AgentWallet-Plugins/cli
npm install
npm link   # makes `emblemai` available globally
```

## First Run

1. Install: `npm install -g @emblemvault/agentwallet`
2. Run: `emblemai`
3. Authenticate in the browser (or enter a password if prompted)
4. Check `/plugins` to see which plugins loaded
5. Type `/help` to see all commands
6. Try: "What are my wallet addresses?" to verify authentication

---

## Authentication

EmblemAI v3 supports two authentication methods: **browser auth** for interactive use and **password auth** for agent/scripted use.

### Browser Auth (Interactive Mode)

When you run `emblemai` without `-p`, the CLI:

1. Checks `~/.emblemai/session.json` for a saved session
2. If a valid (non-expired) session exists, restores it instantly -- no login needed
3. If no session, starts a local server on `127.0.0.1:18247` and opens your browser
4. You authenticate via the EmblemVault auth modal in the browser
5. The session JWT is captured, saved to disk, and the CLI proceeds
6. If the browser can't open, the URL is printed for manual copy-paste
7. If authentication times out (5 minutes), falls back to a password prompt

### Password Auth (Agent Mode)

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses return the same vault. Different passwords produce different wallets.

In agent mode, if no password is provided, a secure random password is auto-generated and stored encrypted via dotenvx. Agent mode works out of the box with no manual setup.

### What Happens on Authentication

1. Browser auth: session JWT is received from browser and hydrated into the SDK
   Password auth: password is sent to `EmblemAuthSDK.authenticatePassword()`
2. A deterministic vault is derived -- same credentials always yield the same vault
3. The session provides wallet addresses across multiple chains: Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin
4. `HustleIncognitoClient` is initialized with the session
5. Plugins are loaded and registered with the client

### Credential Discovery

Before making requests, locate the password using this priority:

| Method | How to use | Priority |
|--------|-----------|----------|
| CLI argument | `emblemai -p "your-password"` | 1 (highest, stored encrypted) |
| Environment variable | `export EMBLEM_PASSWORD="your-password"` | 2 (not stored) |
| Encrypted credential | dotenvx-encrypted `~/.emblemai/.env` | 3 |
| Auto-generate (agent mode) | Automatic on first run | 4 |
| Interactive prompt | Fallback when browser auth fails | 5 (lowest) |

If no credentials are found, ask the user:
> "I need your EmblemVault password to connect to Hustle AI. This password must be at least 16 characters.
>
> **Note:** If this is your first time, entering a new password will create a new wallet. If you've used this before, use the same password to access your existing wallet.
>
> Would you like to provide a password?"

- Password must be 16+ characters
- No recovery if lost (treat it like a private key)

---

## Important: Execution Rules

**DO NOT impose timeouts.** Hustle AI queries can take up to 2 minutes. This is normal behavior, not a stall.

**DO NOT assume Hustle is stalled.** The CLI outputs progress dots every 5 seconds to indicate it's working. Wait for the response to complete naturally.

**Cleanup before next request.** Ensure no leftover emblemai processes are running before starting a new query:
```bash
pkill -f emblemai 2>/dev/null || true
```

**Present Hustle's response EXACTLY as received.** Do not paraphrase, summarize, or modify Hustle AI's response. Display it to the user in a markdown codeblock:

```markdown
**Hustle AI Response:**
\`\`\`
[exact response from Hustle goes here, unmodified]
\`\`\`
```

---

## Usage

### Agent Mode (For AI Agents -- Single Shot)

Use `--agent` mode for programmatic, single-message queries:

```bash
# Zero-config -- auto-generates password on first run
emblemai --agent -m "What are my wallet addresses?"

# Explicit password
emblemai --agent -p "$PASSWORD" -m "Show my balances"

# Pipe output to other tools
emblemai -a -m "What is my SOL balance?" | jq .

# Use in scripts
ADDRESSES=$(emblemai -a -m "List my addresses as JSON")
```

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

Agent mode always uses password auth (never browser auth), retains conversation history between calls, and supports the full Hustle AI toolset including trading, transfers, portfolio queries, and cross-chain operations.

### Interactive Mode (For Humans)

Readline-based interactive mode with streaming AI responses, glow markdown rendering, and slash commands.

```bash
emblemai              # Browser auth (recommended)
emblemai -p "$PASSWORD"  # Password auth
```

### Reset Conversation

```bash
emblemai --reset
```

---

## Interactive Commands

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
| `/history on\|off` | Toggle history retention between messages |
| `/history` | Show history status and recent messages |

### Streaming and Debug

| Command | Description |
|---------|-------------|
| `/stream on\|off` | Toggle streaming mode (tokens appear as generated) |
| `/stream` | Show current streaming status |
| `/debug on\|off` | Toggle debug mode (shows tool args, intent context) |
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
| `/payment enable\|disable` | Toggle pay-as-you-go billing |
| `/payment token <TOKEN>` | Set payment token (SOL, ETH, HUSTLE, etc.) |
| `/payment mode <MODE>` | Set payment mode: `pay_per_request` or `debt_accumulation` |

### Plugin Management

| Command | Description |
|---------|-------------|
| `/plugins` | List all plugins with enabled/disabled status |
| `/plugin <name> on\|off` | Toggle a plugin by name |

### Secrets

| Command | Description |
|---------|-------------|
| `/secrets` | Manage encrypted plugin secrets (interactive menu) |

Secrets are encrypted with your vault key and stored in `~/.emblemai/secrets.json`. Plugins are hot-reloaded after setting a secret (no restart needed).

### Markdown Rendering

| Command | Description |
|---------|-------------|
| `/glow on\|off` | Toggle markdown rendering via glow |
| `/glow` | Show glow status and version |

Requires [glow](https://github.com/charmbracelet/glow) to be installed.

### Logging

| Command | Description |
|---------|-------------|
| `/log on\|off` | Toggle stream logging to file |
| `/log` | Show logging status and file path |

Log file defaults to `~/.emblemai-stream.log`. Override with `--log-file <path>`.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Up` | Recall previous input |
| `Ctrl+C` | Exit |
| `Ctrl+D` | Exit (EOF) |

---

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

---

## Communication Style

**CRITICAL: Use verbose, natural language.**

Hustle AI interprets terse commands as "$0" transactions. Always explain your intent in full sentences.

| Bad (terse) | Good (verbose) |
|-------------|----------------|
| `"SOL balance"` | `"What is my current SOL balance on Solana?"` |
| `"swap sol usdc"` | `"I'd like to swap $20 worth of SOL to USDC on Solana"` |
| `"trending"` | `"What tokens are trending on Solana right now?"` |

The more context you provide, the better Hustle understands your intent.

---

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

---

## Plugins

### Active Plugin

#### ElizaOS -- AI Agent Framework

**Package**: `@agenthustle/plugin-masq`
**Status**: Loaded by default

Connects Hustle to the ElizaOS agent framework. Provides MASQ mode (HTTP server on port 3001) and inverse discovery to discover and register ElizaOS actions as client tools.

**Auto-configured at startup:**
- **MASQ**: Enabled on port 3001 -- exposes Hustle as an ElizaOS-compatible HTTP agent
- **Inverse discovery**: Enabled -- discovers actions from a running ElizaOS instance and registers them as client tools
- **Hustle client**: Wired automatically for inverse control (ElizaOS actions route through `hustleClient.chat()`)

**Environment variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `ELIZA_URL` | ElizaOS agent URL for inverse discovery | `http://localhost:3000` |
| `ELIZA_API_URL` | ElizaOS API URL (via `--eliza-url` flag) | -- |

### Available Plugins (Not Loaded)

The following plugins exist as packages but are currently disabled. They can be re-enabled via `/plugin <name> on`.

| Plugin | Package | Description |
|--------|---------|-------------|
| A2A | `@agenthustle/plugin-a2a` | Google Agent-to-Agent protocol v0.3.0 (discovery, messaging, tasks) |
| ACP | `@agenthustle/plugin-acp` | Virtuals Agent Commerce Protocol (marketplace, jobs, autonomous mode) |
| Bridge | `@agenthustle/plugin-bridge` | Cross-protocol message router (A2A, ACP, ElizaOS) |

### Plugin Architecture

Plugins follow the `HustlePlugin` interface:

```typescript
{
  name: 'plugin-name',
  version: '1.0.0',
  tools: [{
    name: 'tool_name',
    description: 'What the tool does',
    parameters: { type: 'object', properties: { ... } },
  }],
  executors: {
    tool_name: async (args) => { /* implementation */ },
  },
  hooks: {
    beforeRequest: async (messages) => messages,
    afterResponse: async (response) => response,
    onError: async (error) => null,
  }
}
```

**Loading**: Plugins are loaded via `PluginManager.loadAll()`. Each plugin spec declares a `mod` (npm package name), `factory` (exported factory function), and `configKey` (per-plugin config key). Missing packages are silently skipped.

**Secrets**: Plugins can declare secrets (e.g., API keys) that are encrypted with the user's vault key and stored in `~/.emblemai/secrets.json`. Secrets are lazily decrypted on first tool use. Use `/secrets` to manage them interactively. Plugins are hot-reloaded after setting a secret (no restart needed).

**Custom plugins**: User-created plugins are stored in `~/.emblemai-plugins.json` and loaded at startup. Custom plugins use serialized executor code that is compiled at load time.

---

## Wallet Addresses

Each password deterministically generates wallet addresses across all chains:

| Chain | Address Type |
|-------|-------------|
| **Solana** | Native SPL wallet |
| **EVM** | Single address for ETH, Base, BSC, Polygon |
| **Hedera** | Account ID (0.0.XXXXXXX) |
| **Bitcoin** | Taproot, SegWit, and Legacy addresses |

Ask Hustle: `"What are my wallet addresses?"` to retrieve all addresses.

---

## Auth Backup and Restore

### Backup

From the `/auth` menu (option 8), select **Backup Agent Auth** to export your credentials to a JSON file. This file contains your EmblemVault password -- keep it secure.

### Restore

```bash
emblemai --restore-auth ~/emblemai-auth-backup.json
```

This places the credential files in `~/.emblemai/` so you can authenticate immediately.

---

## Security

**CRITICAL: NEVER share or expose the password publicly.**

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

---

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

Legacy credentials (`~/.emblem-vault`) are automatically migrated to the new dotenvx-encrypted format on first run. The old file is backed up to `~/.emblem-vault.bak`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `emblemai: command not found` | Run: `npm install -g @emblemvault/agentwallet` |
| "Password must be at least 16 characters" | Use a longer password |
| "Authentication failed" | Check network connectivity to auth service |
| Browser doesn't open for auth | Copy the printed URL and open it manually |
| Session expired | Run `emblemai` again -- browser will open for fresh login |
| glow not rendering | Install glow: `brew install glow` (optional, falls back to plain text) |
| Plugin not loading | Check that the npm package is installed |
| MASQ not responding on :3001 | Check ElizaOS plugin loaded via `/plugins` |
| **Slow response** | Normal -- queries can take up to 2 minutes |

---

## Updating

```bash
npm update -g @emblemvault/agentwallet
```

---

## Quick Reference

```bash
# Install
npm install -g @emblemvault/agentwallet

# Interactive mode (browser auth -- recommended)
emblemai

# Agent mode (zero-config -- auto-generates wallet)
emblemai --agent -m "What are my balances?"

# Agent mode with explicit password
emblemai --agent -p "your-password-16-chars-min" -m "What tokens do I have?"

# Use environment variable
export EMBLEM_PASSWORD="your-password-16-chars-min"
emblemai --agent -m "Show my portfolio"

# Reset conversation history
emblemai --reset
```

---

## Links

- [npm package](https://www.npmjs.com/package/@emblemvault/agentwallet)
- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
