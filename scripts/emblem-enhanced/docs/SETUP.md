# EmblemAI Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **Terminal** with 256-color support (iTerm2, Kitty, Windows Terminal, or any xterm-compatible terminal)
- **Optional**: [glow](https://github.com/charmbracelet/glow) for rich markdown rendering (`brew install glow` on macOS)

## Installation

### From npm

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

## Authentication

EmblemAI v3 supports two authentication modes: **browser auth** for interactive use and **password auth** for agent/scripted use.

### Browser Auth (Interactive Mode)

When you run `emblemai` without `-p`, the CLI:

1. Checks `~/.emblemai/session.json` for a saved session
2. If a valid (non-expired) session exists, restores it instantly -- no login needed
3. If no session, starts a local server on `127.0.0.1:18247` and opens your browser
4. You authenticate via the EmblemVault auth modal in the browser
5. The session JWT is captured, saved to disk, and the CLI proceeds
6. If the browser can't open, the URL is printed for manual copy-paste
7. If authentication times out (5 minutes), falls back to a password prompt

### Password Auth (Agent Mode and `-p` flag)

**Login and signup are the same action** -- the first use of a password creates a vault, and subsequent uses of the same password return the same vault.

#### Password requirements

- Minimum 16 characters
- No recovery if lost (treat it like a private key)
- Different passwords produce completely different wallets and identities

#### Password resolution (priority order)

| Method | How to use | Priority |
|--------|-----------|----------|
| CLI argument | `emblemai -p "your-password-16-chars-min"` | 1 (highest, stored encrypted) |
| Environment variable | `export EMBLEM_PASSWORD="your-password"` | 2 (not stored) |
| Encrypted credential | dotenvx-encrypted `~/.emblemai/.env` | 3 |
| Auto-generate (agent mode) | Automatic on first run | 4 |
| Interactive prompt | Fallback when browser auth fails | 5 (lowest) |

In agent mode, if no password is found from sources 1-3, a secure random password is auto-generated and stored encrypted. This means agent mode works out of the box with no manual password setup.

### What happens on authentication

1. Browser auth: session JWT is received from browser and hydrated into the SDK
   Password auth: password is sent to `EmblemAuthSDK.authenticatePassword()`
2. A deterministic vault is derived -- same credentials always yield the same vault
3. The session provides wallet addresses across multiple chains: Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin
4. `HustleIncognitoClient` is initialized with the session
5. Plugins are loaded and registered with the client

## Running Modes

### Interactive Mode (Default)

Readline-based interactive mode with streaming, glow rendering, and slash commands.

```bash
emblemai              # Browser auth (recommended)
emblemai -p "your-password"  # Password auth (skips browser)
```

### Agent Mode

Single-shot queries for scripts and AI agent integrations. Sends one message, prints the response, and exits. Always uses password auth.

```bash
emblemai --agent -p "your-password" -m "What are my wallet addresses?"
emblemai -a -p "your-password" -m "Show all my balances"
```

### Reset Conversation

```bash
emblemai --reset
```

## Auth Backup and Restore

### Backup

From the `/auth` menu (option 8), select **Backup Agent Auth** to export your credentials to a JSON file. This file contains your EmblemVault password -- keep it secure.

### Restore

```bash
emblemai --restore-auth ~/emblemai-auth-backup.json
```

This places the credential files in `~/.emblemai/` so you can authenticate immediately.

## Command-Line Flags

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

## First Run

1. Install: `npm install -g @emblemvault/agentwallet`
2. Run: `emblemai`
3. Authenticate in the browser (or enter a password if prompted)
4. Check `/plugins` to see which plugins loaded
5. Type `/help` to see all commands
6. Try: "What are my wallet addresses?" to verify authentication

## File Locations

| File | Purpose |
|------|---------|
| `~/.emblemai/.env` | dotenvx-encrypted credentials (EMBLEM_PASSWORD) |
| `~/.emblemai/.env.keys` | dotenvx private decryption key (chmod 600) |
| `~/.emblemai/secrets.json` | auth-sdk encrypted plugin secrets |
| `~/.emblemai/session.json` | Saved browser auth session (auto-managed) |
| `~/.emblemai/history/{vaultId}.json` | Conversation history (per vault) |
| `~/.emblemai-stream.log` | Stream log (when enabled) |
| `~/.emblemai-plugins.json` | Custom plugin definitions |

Legacy credentials (`~/.emblem-vault`) are automatically migrated to the new dotenvx-encrypted format on first run. The old file is backed up to `~/.emblem-vault.bak`.

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Password must be at least 16 characters" | Use a longer password |
| "Authentication failed" | Check network connectivity to auth service |
| Browser doesn't open for auth | Copy the printed URL and open it manually |
| Session expired | Run `emblemai` again -- it will open the browser for a fresh login |
| glow not rendering | Install glow: `brew install glow` (optional, falls back to plain text) |
| Plugin not loading | Check that the npm package is installed |
| MASQ not responding on :3001 | Check ElizaOS plugin loaded via `/plugins` |
