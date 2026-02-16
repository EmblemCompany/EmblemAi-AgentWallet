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

Connect to **Agent Hustle** -- EmblemVault's autonomous crypto AI with 256+ trading tools across 7 blockchains. Browser auth, streaming responses, plugin system, and zero-config agent mode.

---

## Quick Start -- How to Use This Skill

When this skill loads, you can ask Agent Hustle anything about crypto:

**Example commands to try:**
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

---

## Installation

```bash
npm install -g @emblemvault/agentwallet
```

This provides a single unified command: `emblemai`

---

## Authentication

EmblemAI v3 supports two authentication methods: **browser auth** for interactive use and **password auth** for agent/scripted use.

### Browser Auth (Interactive Mode)

Run `emblemai` without `-p` and the CLI opens your browser to authenticate via the EmblemVault auth modal. Sessions are saved locally in `~/.emblemai/session.json` and restored automatically on subsequent runs.

If the browser fails to open, the URL is printed for manual copy-paste. If authentication times out (5 minutes), falls back to password prompt.

### Password Auth (Agent Mode)

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses return the same vault. Different passwords produce different wallets.

In agent mode, if no password is provided, a secure random password is auto-generated and stored encrypted via dotenvx. Agent mode works out of the box with no manual setup.

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
```

Any system that can shell out to a CLI can give its agents a wallet:

```bash
# OpenClaw, CrewAI, AutoGPT, or any agent framework
emblemai --agent -m "Send 0.1 SOL to <address>"
emblemai --agent -m "Swap 100 USDC to ETH on Base"
```

### Interactive Mode (For Humans)

```bash
emblemai              # Browser auth (recommended)
emblemai -p "$PASSWORD"  # Password auth
```

**Interactive Commands:**
| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/settings` | Show current config |
| `/auth` | Open auth menu (session info, addresses, backup, logout) |
| `/wallet` | Show wallet addresses |
| `/portfolio` | Show portfolio |
| `/plugins` | List all plugins with status |
| `/plugin <name> on\|off` | Toggle a plugin |
| `/tools` | List available tools |
| `/tools add\|remove <id>` | Manage tools |
| `/stream on\|off` | Toggle streaming mode |
| `/debug on\|off` | Toggle debug mode |
| `/history on\|off` | Toggle history retention |
| `/payment` | PAYG billing status |
| `/secrets` | Manage encrypted plugin secrets |
| `/glow on\|off` | Toggle markdown rendering |
| `/model <id>` | Set model (or "clear" to reset) |
| `/reset` | Clear conversation history |
| `/exit` | Exit the CLI |

### Reset Conversation

```bash
emblemai --reset
```

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
| `--log-file <path>` | | Override log file path |
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
| `ELIZA_URL` | ElizaOS agent URL for inverse discovery |

---

## Communication Style

**CRITICAL: Use verbose, natural language.**

Hustle AI interprets terse commands as "$0" transactions. Always explain your intent in full sentences.

| Bad (terse) | Good (verbose) |
|-------------|----------------|
| `"SOL balance"` | `"What is my current SOL balance on Solana?"` |
| `"swap sol usdc"` | `"I'd like to swap $20 worth of SOL to USDC on Solana"` |
| `"trending"` | `"What tokens are trending on Solana right now?"` |

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

| Plugin | Package | Status |
|--------|---------|--------|
| ElizaOS | `@agenthustle/plugin-masq` | Loaded by default |
| A2A | `@agenthustle/plugin-a2a` | Available |
| ACP | `@agenthustle/plugin-acp` | Available |
| Bridge | `@agenthustle/plugin-bridge` | Available |

Manage plugins with `/plugins` and `/plugin <name> on|off`. Plugins can declare encrypted secrets managed via `/secrets`.

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
| `~/.emblemai/.env` | dotenvx-encrypted credentials |
| `~/.emblemai/.env.keys` | dotenvx private decryption key (chmod 600) |
| `~/.emblemai/secrets.json` | Encrypted plugin secrets |
| `~/.emblemai/session.json` | Saved browser auth session |
| `~/.emblemai/history/{vaultId}.json` | Conversation history (per vault) |
| `~/.emblemai-stream.log` | Stream log (when enabled) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `emblemai: command not found` | Run: `npm install -g @emblemvault/agentwallet` |
| `Authentication failed` | Check password is 16+ characters |
| Browser doesn't open for auth | Copy the printed URL and open it manually |
| Session expired | Run `emblemai` again -- browser will open for fresh login |
| `Empty response` | Retry -- Hustle AI may be temporarily unavailable |
| **Slow response** | Normal -- queries can take up to 2 minutes |
| Plugin not loading | Check that the npm package is installed |

---

## Updating

```bash
npm update -g @emblemvault/agentwallet
```

---

## Quick Reference

```bash
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
