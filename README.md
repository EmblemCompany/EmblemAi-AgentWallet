# Emblem Agent Wallet

Give AI agents their own crypto wallets across 7 blockchains. Powered by [Hustle AI](https://agenthustle.ai) with 256+ trading tools -- swaps, limit orders, DeFi, NFTs, bridges, memecoins, and more.

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Quick Start

```bash
# Interactive mode -- opens browser for authentication
emblemai

# Agent mode -- single-shot queries for scripts and AI frameworks
emblemai --agent -m "What are my wallet addresses?"

# Agent mode with a specific wallet identity
emblemai --agent -p "your-password-16-chars-min" -m "Show my balances across all chains"
```

## Authentication

EmblemAI v3 supports two authentication methods:

### Browser Auth (Interactive Mode)

Run `emblemai` without `-p` and the CLI opens your browser to authenticate via the EmblemVault auth modal. Sessions are saved locally and restored automatically on subsequent runs.

### Password Auth (Agent Mode)

**Login and signup are the same action.** The first use of a password creates a vault; subsequent uses return the same vault. Different passwords produce different wallets.

In agent mode, if no password is provided, a secure random password is auto-generated and stored encrypted. Agent mode works out of the box with no manual setup.

| Method | How to use | Priority |
|--------|-----------|----------|
| CLI argument | `emblemai -p "your-password"` | 1 (highest) |
| Environment variable | `export EMBLEM_PASSWORD="your-password"` | 2 |
| Encrypted credential | Auto-managed in `~/.emblemai/.env` | 3 |
| Auto-generate (agent mode) | Automatic on first run | 4 |

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

Single-shot queries for scripts and AI agent integrations. Sends one message, prints the response, and exits.

```bash
emblemai --agent -p "your-password" -m "Swap $20 of SOL to USDC"
emblemai -a -m "What tokens do I hold across all chains?"
```

Any system that can shell out to a CLI can give its agents a wallet:

```bash
# OpenClaw, CrewAI, AutoGPT, or any agent framework
emblemai --agent -m "Send 0.1 SOL to <address>"
emblemai --agent -m "What's trending on Solana?"
```

### Reset Conversation

```bash
emblemai --reset
```

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

## Plugins

| Plugin | Package | Status |
|--------|---------|--------|
| ElizaOS | `@agenthustle/plugin-masq` | Loaded by default |
| A2A | `@agenthustle/plugin-a2a` | Available |
| ACP | `@agenthustle/plugin-acp` | Available |
| Bridge | `@agenthustle/plugin-bridge` | Available |

Manage plugins with `/plugins` and `/plugin <name> on|off` in interactive mode.

## Security

| Concept | Description |
|---------|-------------|
| **Password = Identity** | Each password generates a unique, deterministic vault |
| **No Recovery** | Lost password = lost wallet (treat it like a private key) |
| **Vault Isolation** | Different passwords = completely separate wallets |
| **Fresh Auth** | New JWT token generated on every request |

## Documentation

- [Setup Guide](scripts/emblem-enhanced/docs/SETUP.md) -- installation, auth, running modes
- [Commands](scripts/emblem-enhanced/docs/COMMANDS.md) -- full command reference
- [Plugins](scripts/emblem-enhanced/docs/PLUGINS.md) -- plugin system and tool reference

## Links

- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [npm package](https://www.npmjs.com/package/@emblemvault/agentwallet)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
