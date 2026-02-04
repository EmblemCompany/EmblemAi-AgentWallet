# @emblemvault/agentwallet

CLI for EmblemVault's Hustle AI - autonomous crypto wallet management across 7 blockchains.

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Commands

```bash
# Chat with Hustle AI
emblem-hustle -p "your-password-16-chars-min" -m "What are my wallet addresses?"

# Resume with conversation context
emblem-resume -p "your-password" -m "Follow-up question"

# Reset conversation history
emblem-reset
```

## Authentication

**Login and signup are the same action.**

| Scenario | What Happens |
|----------|--------------|
| First time with a password | Creates a new vault with unique addresses |
| Same password again | Returns the same vault (deterministic) |
| Different password | Creates a completely different vault |

- Password must be 16+ characters
- No recovery if lost (treat it like a private key)

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Links

- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [OpenClaw Skill](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
