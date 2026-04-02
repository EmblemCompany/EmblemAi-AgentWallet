---
name: emblem-ai-agent-wallet
description: Connect to EmblemVault and manage crypto wallets via EmblemAI. Supports Solana, Ethereum, Base, BSC, Polygon, Hedera, and Bitcoin. Use when the user wants to trade crypto, check balances, swap tokens, interact with blockchain wallets, or create and use profile-scoped agent wallets.
homepage: https://emblemvault.dev
user-invocable: true
metadata: {"openclaw":{"emoji":"🛡️","version":"3.0.8","homepage":"https://emblemvault.dev","primaryEnv":"EMBLEM_PASSWORD","requires":{"bins":["node","npm","emblemai"]},"config_paths":["~/.emblemai/active-profile","~/.emblemai/profiles/"],"install":[{"id":"npm","kind":"npm","package":"@emblemvault/agentwallet","bins":["emblemai"],"label":"Install Agent Wallet CLI"}]}}
---

# Emblem Agent Wallet

Connect to **EmblemAI** -- EmblemVault's autonomous crypto AI with 250+ trading tools across 7 blockchains. Browser auth, streaming responses, profile-scoped local state, plugin system, and zero-config agent mode.

**Requires the CLI**: `npm install -g @emblemvault/agentwallet`

---

## Quick Start -- How to Use This Skill

**Step 1: Install the CLI**

```bash
npm install -g @emblemvault/agentwallet
```

This provides a single command: `emblemai`

**Step 2: Use it**

When this skill loads, you can ask EmblemAI anything about crypto:

- "What are my wallet addresses?"
- "Show my balances across all chains"
- "What's trending on Solana?"
- "Swap $20 of SOL to USDC"
- "Send 0.1 ETH to 0x..."

For zero-config agent provisioning, a profile can create and persist its own wallet with a single command:

```bash
emblemai --agent --profile hustle -m "What are my wallet addresses?"
```

**To invoke this skill, say things like:**
- "Use my Emblem wallet to check balances"
- "Ask EmblemAI what tokens I have"
- "Connect to EmblemVault"
- "Check my crypto portfolio"
- "Create or use my agent wallet profile and show my addresses"

All requests are routed through `emblemai` under the hood. If more than one profile exists, every agent-mode invocation must include `--profile <name>`.

---

## Prerequisites

- **Node.js** >= 20.18.0
- **Terminal** with 256-color support (iTerm2, Kitty, Windows Terminal, or any xterm-compatible terminal)
- **Optional**: [glow](https://github.com/charmbracelet/glow) for rich markdown rendering (`brew install glow` on macOS)

## Installation

### From npm (Recommended)

```bash
npm install -g @emblemvault/agentwallet
```

### From source

```bash
git clone https://github.com/EmblemCompany/EmblemAi-cli.git
cd EmblemAi-cli
npm install
npm link   # makes `emblemai` available globally
```

## First Run

1. Install: `npm install -g @emblemvault/agentwallet`
2. Create or pick a profile: `emblemai profile create hustle`
3. Run either `emblemai --profile hustle` or `emblemai --agent --profile hustle -m "What are my wallet addresses?"`
4. Check `/plugins` to see which plugins loaded
5. Type `/help` to see all commands
6. Back up profile auth immediately after first wallet creation

---

## Authentication

EmblemAI v3 supports two authentication methods with profile-scoped local state: **browser auth** for interactive use and **password auth** for agent/scripted use.

### Profile Rules

Profiles are the canonical multi-agent isolation mechanism.

- `emblemai profile list`
- `emblemai profile create <name>`
- `emblemai profile use <name>`
- `emblemai profile inspect [name]`
- `emblemai profile delete <name>`
- `emblemai --profile <name> ...`

**Fail closed rule:** if more than one profile exists in `~/.emblemai`, every `--agent` invocation must include `--profile <name>`. Agent mode never guesses which wallet identity to use.

Using separate `HOME` directories is optional isolation, not the primary pattern. Prefer profiles first.

### Browser Auth (Interactive Mode)

When you run `emblemai --profile <name>` without `-p`, the CLI:

1. Checks the selected profile for a saved session
2. If a valid (non-expired) session exists, restores it instantly -- no login needed
3. If no session, starts a local server on `127.0.0.1:18247` and opens your browser
4. You authenticate via the EmblemVault auth modal in the browser
5. The session JWT is captured, saved to that profile on disk, and the CLI proceeds
6. If the browser can't open, the URL is printed for manual copy-paste
7. If authentication times out (5 minutes), falls back to a password prompt for the same profile

### Password Auth (Agent Mode)

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses of the same password return the same vault. Different passwords produce different wallets, while profiles isolate the local session and stored credentials around those wallets.

In agent mode, if no password is provided for the selected profile, a secure random password is auto-generated and stored encrypted via dotenvx under `~/.emblemai/profiles/<name>/`. Agent mode works out of the box with no manual setup.

### What Happens on Authentication

1. The selected profile is resolved
2. Browser auth: session JWT is received from browser and hydrated into the SDK
   Password auth: password is sent to `EmblemAuthSDK.authenticatePassword()` and can be stored in the selected profile for reuse
3. A deterministic vault is derived -- same credentials always yield the same vault
4. The session provides wallet addresses across multiple chains: Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin
5. The EmblemAI client is initialized with the profile's session

### Credential Discovery

Before making requests for a profile, locate the password using this priority:

| Method | How to use | Priority |
|--------|-----------|----------|
| CLI argument | `emblemai --profile <name> -p "your-password"` | 1 (highest, stored encrypted) |
| Environment variable | `EMBLEM_PASSWORD="your-password" emblemai --profile <name>` | 2 (not stored) |
| Encrypted credential | dotenvx-encrypted `~/.emblemai/profiles/<name>/.env` | 3 |
| Auto-generate (agent mode) | `emblemai --agent --profile <name> ...` on first run | 4 |
| Interactive prompt | Fallback when browser auth fails | 5 (lowest) |

Interactive mode resolves auth for the selected profile in this order: saved session, stored password, browser auth modal, then terminal password prompt.

If no credentials are found for the selected profile, agent mode can auto-generate and store them automatically. Ask the user for a password only when they explicitly want to connect an existing password-derived wallet:
> "I can create a fresh EmblemVault wallet for this profile automatically, or connect an existing wallet if you enter the original password locally in the CLI.
>
> **Note:** If this is your first time, entering a new password will create a new wallet. If you've used this before, use the same password to access your existing wallet.
>
> Would you like to provide a password for this profile in the terminal?"

- Password must be 16+ characters
- No recovery if lost (treat it like a private key)

---

## Execution Notes

**Allow sufficient time.** EmblemAI queries may take up to 2 minutes for complex operations (trading, cross-chain lookups). The CLI outputs progress dots every 5 seconds to indicate it's working.

**Present EmblemAI's response clearly.** Display the response from EmblemAI to the user in a markdown codeblock:

```markdown
**EmblemAI Response:**
\`\`\`
[response from EmblemAI]
\`\`\`
```

---

## Usage

### Agent Mode (For AI Agents -- Single Shot)

Use `--agent` mode for programmatic, single-message queries with profile-scoped auth:

```bash
# Zero-config -- auto-generates a wallet for the profile on first run
emblemai --agent --profile hustle -m "What are my wallet addresses?"

# Explicit password for a profile
emblemai --agent --profile hustle -p "$PASSWORD" -m "Show my balances"

# Pipe output to other tools
emblemai -a --profile treasury -m "What is my SOL balance?" | jq .

# Use in scripts
ADDRESSES=$(emblemai -a --profile treasury -m "List my addresses as JSON")
```

Any system that can shell out to a CLI can give its agents a wallet:

```bash
# OpenClaw, CrewAI, AutoGPT, or any agent framework
emblemai --agent --profile ops -m "Send 0.1 SOL to <address>"
emblemai --agent --profile treasury -m "Swap 100 USDC to ETH on Base"
emblemai --agent --profile research -m "What tokens do I hold across all chains?"
```

Profiles are the primary way to isolate agent wallets. To give multiple agents separate wallets, use different profiles:

```bash
emblemai --agent --profile agent-alice -m "My addresses?"
emblemai --agent --profile agent-bob -m "My addresses?"
```

Agent mode always uses password auth (never browser auth), retains conversation history between calls for the selected profile, and supports the full EmblemAI toolset including trading, transfers, portfolio queries, and cross-chain operations.

### Interactive Mode (For Humans)

Readline-based interactive mode with streaming AI responses, glow markdown rendering, and slash commands.

```bash
emblemai --profile hustle              # Browser auth (recommended)
emblemai --profile hustle -p "$PASSWORD"  # Password auth
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

### Profiles

| Command | Description |
|---------|-------------|
| `/profile` | List profiles with current/default markers |
| `/profile create <name>` | Create a named profile |
| `/profile use <name>` | Switch this session and new sessions to a profile |
| `/profile inspect [name]` | Inspect profile metadata, files, and runtime wallet info |
| `/profile delete <name>` | Delete a noncurrent profile |

If more than one profile exists, every agent-mode CLI invocation must include `--profile <name>`.

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
| `/model clear` | Reset to the CLI's default model |
| `/model` | Show currently selected model |
| `/models` | Show current model and curated default choices |
| `/models use <number\|id>` | Pick one of the curated default models |
| `/models search <query>` | Fuzzy-search OpenRouter models and pick one via `/model <number\|id>` |

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
| 8. Backup Agent Auth | Export the current profile's auth material to a backup file |
| 9. Logout | Clear the current profile session and exit (encrypted credentials remain on disk) |

### Payment (PAYG Billing)

| Command | Description |
|---------|-------------|
| `/payment` | Show PAYG billing status (enabled, mode, debt, tokens) |
| `/payment enable\|disable` | Toggle pay-as-you-go billing |
| `/payment token <TOKEN>` | Set payment token (SOL, ETH, HUSTLE, etc.) |
| `/payment mode <MODE>` | Set payment mode: `pay_per_request` or `debt_accumulation` |

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
| `--profile <name>` | | Select a named wallet profile for the invocation |
| `--password <pw>` | `-p` | Authentication password (16+ chars) -- skips browser auth |
| `--message <msg>` | `-m` | Message for agent mode |
| `--agent` | `-a` | Run in agent mode (single-shot, password auth only; requires `--profile` when multiple profiles exist) |
| `--restore-auth <path>` | | Restore credentials from backup file into the selected profile and exit |
| `--reset` | | Clear conversation history and exit |
| `--debug` | | Start with debug mode enabled |
| `--stream` | | Start with streaming enabled (default: on) |
| `--log` | | Enable stream logging |
| `--log-file <path>` | | Override log file path (default: `~/.emblemai-stream.log`) |
| `--hustle-url <url>` | | Override EmblemAI server URL |
| `--auth-url <url>` | | Override auth service URL |
| `--api-url <url>` | | Override API service URL |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBLEM_PASSWORD` | Authentication password |
CLI arguments override environment variables when both are provided. Profile-scoped stored credentials are checked after explicit CLI and environment overrides.

---

## Permissions and Safe Mode

The agent operates in **safe mode by default**. Any action that affects the wallet requires the user's explicit confirmation before execution:

- **Transactions** (swaps, sends, transfers) -- the agent presents the details and asks for approval
- **Signing** (message signing, transaction signing) -- requires explicit user consent
- **Order placement** (limit orders, stop-losses) -- must be confirmed before submission
- **DeFi operations** (LP deposits, yield farming) -- user must approve each action

Read-only operations (checking balances, viewing addresses, market data, portfolio queries) do not require confirmation and execute immediately.

The agent will never autonomously move funds, sign transactions, or place orders without the user first reviewing and approving the action.

---

## Communication Style

**CRITICAL: Use verbose, natural language.**

EmblemAI interprets terse commands as "$0" transactions. Always explain your intent in full sentences.

| Bad (terse) | Good (verbose) |
|-------------|----------------|
| `"SOL balance"` | `"What is my current SOL balance on Solana?"` |
| `"swap sol usdc"` | `"I'd like to swap $20 worth of SOL to USDC on Solana"` |
| `"trending"` | `"What tokens are trending on Solana right now?"` |

The more context you provide, the better EmblemAI understands your intent.

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

## Wallet Addresses

Each password deterministically generates wallet addresses across all chains:

| Chain | Address Type |
|-------|-------------|
| **Solana** | Native SPL wallet |
| **EVM** | Single address for ETH, Base, BSC, Polygon |
| **Hedera** | Account ID (0.0.XXXXXXX) |
| **Bitcoin** | Taproot, SegWit, and Legacy addresses |

Ask EmblemAI: `"What are my wallet addresses?"` to retrieve all addresses.

---

## Auth Backup and Restore

### Backup

From the `/auth` menu (option 8), select **Backup Agent Auth** to export your credentials for the current profile to a JSON file. This file contains your EmblemVault password -- keep it secure.

### Restore

```bash
emblemai --profile hustle --restore-auth ~/emblemai-auth-backup.json
```

Restore is profile-aware. If the target profile does not exist yet, it is created first. The credential files are placed under `~/.emblemai/profiles/<name>/` so you can authenticate immediately.

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
| **Profile Isolation** | Each profile stores its own session, password material, plugins, and history |
| **Fresh Auth** | New JWT token generated on every request |
| **Safe Mode** | All wallet actions require explicit user confirmation |

---

## File Locations

All persistent data is stored under `~/.emblemai/` (created on first run with `chmod 700`).

```text
~/.emblemai/
  active-profile
  profiles/
    default/
      metadata.json
      session.json
      .env
      .env.keys
      secrets.json
      plugins.json
      x402-favorites.json
      history/
        <vaultId>.json
```

| File | Purpose | Sensitive | Permissions |
|------|---------|-----------|-------------|
| `~/.emblemai/active-profile` | Selected default profile marker | No | `600` |
| `~/.emblemai/profiles/` | Profile container directory | Mixed | `700` |
| `~/.emblemai/profiles/<name>/.env` | Encrypted credentials (EMBLEM_PASSWORD) | Yes -- AES-256-GCM encrypted | `600` |
| `~/.emblemai/profiles/<name>/.env.keys` | Decryption key for `.env` | Yes -- controls access to credentials | `600` |
| `~/.emblemai/profiles/<name>/session.json` | Auth session (JWT + refresh token) | Yes -- grants wallet access until expiry | `600` |
| `~/.emblemai/profiles/<name>/secrets.json` | Encrypted plugin secrets | Yes -- local-only secret material | `600` |
| `~/.emblemai/profiles/<name>/plugins.json` | Per-profile custom plugins | Sensitive code/config | local-only |
| `~/.emblemai/profiles/<name>/x402-favorites.json` | Saved x402 favorites | No | local-only |
| `~/.emblemai/profiles/<name>/history/{vaultId}.json` | Conversation history (per vault, per profile) | No | local-only |
| `~/.emblemai-stream.log` | Stream log (when enabled via `/log`) | No | default |

Older flat-layout installs are migrated into `~/.emblemai/profiles/default/` on first run.

### Encryption Details

Credentials are encrypted at rest using [dotenvx](https://dotenvx.com/), which uses **AES-256-GCM** symmetric encryption. The encryption key is stored in `~/.emblemai/profiles/<name>/.env.keys` and the encrypted payload in `~/.emblemai/profiles/<name>/.env`. Both files are created with `chmod 600` (owner read/write only). The decryption key never leaves the local machine.

Session tokens (`session.json`) contain a short-lived JWT (refreshed automatically) and a refresh token valid for 7 days. Sessions are not encrypted on disk but are restricted to `chmod 600`. Logging out via `/auth` > Logout deletes the current profile's session file.

Legacy credentials (`~/.emblem-vault`) are automatically migrated into `~/.emblemai/profiles/default/` on first run and the original is backed up.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `emblemai: command not found` | Run: `npm install -g @emblemvault/agentwallet` |
| Agent mode asks for `--profile` | Pass `--profile <name>` when more than one profile exists in `~/.emblemai` |
| "Password must be at least 16 characters" | Use a longer password |
| "Authentication failed" | Check network connectivity to auth service |
| Browser doesn't open for auth | Copy the printed URL and open it manually |
| Session expired | Run `emblemai --profile <name>` again -- browser will open for fresh login |
| glow not rendering | Install glow: `brew install glow` (optional, falls back to plain text) |
| Plugin not loading | Check that the npm package is installed |
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

# Create a profile
emblemai profile create hustle

# Interactive mode (browser auth -- recommended)
emblemai --profile hustle

# Agent mode (zero-config -- auto-generates wallet for the profile)
emblemai --agent --profile hustle -m "What are my balances?"

# Agent mode with explicit password
emblemai --agent --profile hustle -p "your-password-16-chars-min" -m "What tokens do I have?"

# Use environment variable
export EMBLEM_PASSWORD="your-password-16-chars-min"
emblemai --agent --profile hustle -m "Show my portfolio"

# Reset conversation history
emblemai --reset
```

---

## Security Advisory

This section explains the trust model, what happens on your machine, and how to run the agent securely.

### Trust Model

Emblem Agent Wallet is an open-source CLI published by [EmblemCompany](https://github.com/EmblemCompany) on both npm and GitHub. You can verify the package before installing:

- **npm registry**: [@emblemvault/agentwallet](https://www.npmjs.com/package/@emblemvault/agentwallet) -- check the publisher, version history, and download stats
- **Source code**: [github.com/EmblemCompany/EmblemAi-AgentWallet](https://github.com/EmblemCompany/EmblemAi-AgentWallet) -- full source is public and auditable
- **Homepage**: [emblemvault.dev](https://emblemvault.dev) -- the project homepage with documentation

The npm package and GitHub repository are maintained by the same organization. You can compare the published package contents against the source repository at any time using `npm pack --dry-run` or by inspecting `node_modules/@emblemvault/agentwallet` after install.

### What Happens During Installation

`npm install -g @emblemvault/agentwallet` installs the CLI binary `emblemai` globally. Like all global npm packages, this runs on your machine with your user permissions. The package has no `postinstall` scripts -- it only places the CLI binary and its dependencies.

### What Happens During Authentication

**Browser auth** (recommended): The CLI starts a temporary local server on `127.0.0.1:18247` (localhost only, not network-accessible) to receive the auth callback from your browser. This server runs only during the login flow and handles a single request. The browser opens the EmblemVault auth modal where you authenticate directly with the EmblemVault service. On success, a session JWT is returned to the local server and saved to the selected profile on disk.

**Password auth**: The password is sent to EmblemVault's auth API over HTTPS. A session JWT is returned. If using the `-p` flag, the password is also encrypted and stored locally in the selected profile for future sessions. If agent mode is run against a profile with no stored credentials, the CLI can auto-generate the password and save it to that profile.

In both cases, no credentials are sent to any third party. Authentication is strictly between your machine and the EmblemVault auth service.

### What Gets Stored on Disk

All files are created under `~/.emblemai/` with restrictive permissions:

| File | What It Contains | How It's Protected |
|------|-----------------|-------------------|
| `active-profile` | The default profile marker used for future sessions | File permissions `chmod 600`. Contains only the selected profile name. |
| `profiles/<name>/.env` | Your EMBLEM_PASSWORD for that profile | Encrypted with AES-256-GCM via [dotenvx](https://dotenvx.com/). The password is never stored in plaintext. |
| `profiles/<name>/.env.keys` | The AES decryption key for that profile's `.env` | File permissions `chmod 600` (owner-only). This key never leaves your machine and is never transmitted over the network. |
| `profiles/<name>/session.json` | JWT access token + refresh token | File permissions `chmod 600`. The JWT expires after 15 minutes and is automatically refreshed. The refresh token is valid for 7 days. Logging out deletes this file. |
| `profiles/<name>/secrets.json` | Encrypted plugin secrets for that profile | File permissions `chmod 600`. Stores only local encrypted secret material. |
| `profiles/<name>/plugins.json` | Per-profile custom plugin configuration | Local-only configuration. Treat as sensitive code/config. |
| `profiles/<name>/history/*.json` | Conversation history for that profile | File permissions `chmod 600`. Contains your chat messages with the AI. No credentials are stored in history. |

The `~/.emblemai/` and `~/.emblemai/profiles/` directories are created with `chmod 700` (owner-only access).

### How Sessions Work

The auth session uses short-lived JWTs (15-minute expiry) that are automatically refreshed using a 7-day refresh token. This means:

- If your session file is compromised, the attacker has at most 7 days of access (refresh token expiry), not indefinite access
- The JWT is rotated frequently, limiting the window of exposure for any single token
- Logging out (`/auth` > Logout) immediately invalidates the current profile session and deletes the file
- Each refresh issues a new refresh token and invalidates the previous one (rotation)

### Safe Mode and Transaction Confirmation

The agent operates in **safe mode by default**. This means:

- **All wallet-modifying actions require your explicit confirmation** before execution -- including swaps, sends, transfers, order placement, signing, and DeFi operations
- **Read-only operations execute immediately** without confirmation -- balance checks, address lookups, market data, portfolio views
- The agent will present the full details of any transaction (amounts, addresses, fees) and wait for your approval before submitting
- There is no "auto-execute" mode -- every transaction requires a human in the loop

### Password Hygiene

Your EMBLEM_PASSWORD is the master key to your wallet. Treat it with the same care as a private key or seed phrase:

- **Use a strong, unique password** (minimum 16 characters). A passphrase of 4+ random words is recommended
- **Do not reuse passwords** from other services. Your EMBLEM_PASSWORD should be unique to EmblemVault
- **Store your password securely** using a password manager. The CLI encrypts it on disk, but you should have a backup in case you lose access to the machine
- **If using `EMBLEM_PASSWORD` as an environment variable** in automation, ensure the host environment is secured -- restrict access to the machine, use process isolation, and avoid logging environment variables
- **Prefer browser auth for interactive use** -- it avoids placing the password in shell history or environment variables and keeps auth scoped to the selected profile
- **Different passwords create different wallets** -- this is by design. Use this to separate funds by purpose (e.g., one wallet for daily use, another for long-term holdings)

### Verifying the Package

Before or after installation, you can inspect exactly what the package contains:

```bash
# View package contents without installing
npm pack @emblemvault/agentwallet --dry-run

# After installing, inspect the source
ls $(npm root -g)/@emblemvault/agentwallet/

# Compare against GitHub source
git clone https://github.com/EmblemCompany/EmblemAi-AgentWallet.git
diff -r node_modules/@emblemvault/agentwallet EmblemAi-AgentWallet/publish
```

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

- **GitHub**: Open an issue at [github.com/EmblemCompany/EmblemAi-AgentWallet/issues](https://github.com/EmblemCompany/EmblemAi-AgentWallet/issues)
- **Discord**: Report in the security channel at [discord.gg/Q93wbfsgBj](https://discord.gg/Q93wbfsgBj)

---

## Links

- [npm package](https://www.npmjs.com/package/@emblemvault/agentwallet)
- [EmblemVault](https://emblemvault.dev)
- [EmblemAI](https://emblemvault.ai)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
