# Emblem Agent Wallet

Give AI agents their own crypto wallets. 250+ trading tools across 7 blockchains, powered by [Agent Hustle](https://agenthustle.ai).

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Usage

```bash
# Interactive mode (browser auth)
emblemai --profile hustle

# Agent mode (zero-config, single-shot)
emblemai --agent --profile hustle -m "What are my wallet addresses?"
```

If more than one profile exists in `~/.emblemai`, every agent-mode invocation must include `--profile <name>`. Agent mode never guesses which wallet identity to use.

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Docs

See [SKILL.md](SKILL.md) for the full reference -- profiles, authentication, commands, plugins, agent mode, and troubleshooting.

## Links

- [emblemvault.dev](https://emblemvault.dev)
- [npm: @emblemvault/agentwallet](https://www.npmjs.com/package/@emblemvault/agentwallet)
- [GitHub: EmblemCompany](https://github.com/EmblemCompany)
