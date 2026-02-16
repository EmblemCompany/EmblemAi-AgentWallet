# AI Tools Reference

Complete list of built-in tools available through Hustle AI.

## Trading & Swaps

### swap_tokens
Execute token swaps via DEX aggregation.

```
"Swap 0.1 ETH for USDC on Base"
"Buy $50 worth of PEPE"
"Sell half my SHIB for ETH"
```

**Parameters:**
- `fromToken` - Token to sell (symbol or address)
- `toToken` - Token to buy
- `amount` - Amount to swap
- `chain` - Blockchain (ethereum, base, polygon, solana)
- `slippage` - Max slippage % (default: 1%)

### bridge_tokens
Cross-chain token transfers.

```
"Bridge 100 USDC from Ethereum to Base"
"Move my ETH from Polygon to Arbitrum"
```

### limit_order
Place limit orders at target prices.

```
"Buy ETH if it drops to $3,000"
"Sell my PEPE when it hits $0.00001"
```

### stop_loss
Set automatic sell triggers.

```
"Set stop loss for ETH at $2,800"
"Protect my portfolio with 10% stop loss"
```

## Market Research

### get_price
Real-time token prices.

```
"What's the price of Bitcoin?"
"ETH price in USD"
"Show me SOL price"
```

### technical_analysis
TA indicators and signals.

```
"Do technical analysis on ETH"
"Show RSI and MACD for BTC"
"Is ETH overbought?"
```

**Indicators available:**
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Moving Averages (SMA, EMA)
- Volume analysis

### trending_tokens
Discover trending tokens by chain.

```
"What tokens are trending on Base?"
"Show me hot tokens on Solana"
"Trending memecoins today"
```

### social_sentiment
Social media sentiment analysis.

```
"What's the sentiment on ETH?"
"Is DOGE bullish on Twitter?"
"Crypto Twitter mood today"
```

### compare_tokens
Side-by-side token comparison.

```
"Compare ETH vs SOL"
"PEPE vs SHIB - which is better?"
"UNI vs SUSHI comparison"
```

## Token Analysis

### token_security
Security audit and risk assessment.

```
"Is this token safe: 0x..."
"Check if BONK has any red flags"
"Security scan for PEPE"
```

**Checks performed:**
- Honeypot detection
- Rug pull indicators
- Contract verification
- Ownership renounced
- Liquidity locked
- Mint function
- Tax rates

### whale_tracking
Large holder movements.

```
"Show whale movements for ETH"
"Any big PEPE transactions today?"
"Track whale wallets for BTC"
```

### holder_distribution
Token holder analysis.

```
"Who holds the most SHIB?"
"Top 10 ETH holders"
"Is this token concentrated?"
```

### contract_info
Smart contract details.

```
"Show contract for USDC on Base"
"Is this contract verified?"
"What functions does this contract have?"
```

## Portfolio Management

### get_portfolio
Full portfolio overview.

```
"Show my portfolio"
"What tokens do I hold?"
"My total balance in USD"
```

### get_balance
Specific token balances.

```
"What's my ETH balance?"
"How much USDC do I have?"
"Show my Base tokens"
```

### chain_balances
Per-chain breakdown.

```
"Show my holdings on Base"
"Ethereum portfolio"
"All my Solana tokens"
```

### portfolio_pnl
Profit and loss tracking.

```
"Am I up or down today?"
"Show my P&L this week"
"Best performing token in my portfolio"
```

## DeFi

### liquidity_pools
Pool analysis and yields.

```
"Best ETH/USDC pools"
"Show Uniswap V3 pools for ETH"
"Top yield pools on Base"
```

### yield_opportunities
Find yield farming options.

```
"Where can I earn yield on USDC?"
"Best staking opportunities for ETH"
"DeFi yields over 10% APY"
```

### protocol_tvl
Protocol total value locked.

```
"What's Uniswap's TVL?"
"Top DeFi protocols by TVL"
"Aave TVL on Ethereum"
```

### gas_prices
Network gas costs.

```
"Current Ethereum gas price"
"Is gas cheap right now?"
"Best time to transact on Ethereum"
```

## Transfers

### send_tokens
Transfer tokens to addresses.

```
"Send 0.1 ETH to 0x..."
"Transfer 100 USDC to vitalik.eth"
"Send SOL to @friend on Twitter"
```

**Supports:**
- Raw addresses
- ENS names (.eth)
- Social handles (@twitter, farcaster)

## NFTs

### nft_floor
Collection floor prices.

```
"Bored Ape floor price"
"What's Pudgy Penguins at?"
"Cheapest Azuki"
```

### nft_search
Browse NFT collections.

```
"Show me top NFT collections"
"Find cat NFTs on Base"
"Trending NFTs this week"
```

### nft_portfolio
Your NFT holdings.

```
"Show my NFTs"
"What NFTs do I own on Ethereum?"
"My NFT collection value"
```

## Automation

### dca_setup
Dollar-cost averaging.

```
"DCA $100 into ETH every week"
"Set up daily BTC buys of $10"
"Auto-buy ETH monthly"
```

### twap_order
Time-weighted orders.

```
"Buy $1000 ETH over 24 hours"
"TWAP sell my PEPE over 1 week"
```

### scheduled_command
Time-based automation.

```
"Check ETH price every morning"
"Alert me when BTC hits $100k"
"Daily portfolio summary at 9am"
```

## Using Tools Programmatically

```typescript
const response = await client.chat([
  { role: 'user', content: 'What is the price of ETH?' }
]);

// Access tool calls
console.log(response.toolCalls);
// [
//   {
//     name: 'get_price',
//     arguments: { token: 'ETH' },
//     result: { price: 3500.00, change24h: 2.5 }
//   }
// ]
```

## Enable Specific Tool Categories

```typescript
const response = await client.chat(messages, {
  tools: ['trading', 'market']  // Only enable these categories
});
```

**Categories:**
- `trading` - Swaps, bridges, orders
- `market` - Prices, analysis, trending
- `defi` - Pools, yields, protocols
- `analysis` - Security, whales, holders
- `portfolio` - Balances, P&L
- `transfers` - Send tokens
- `nft` - NFT operations
- `automation` - DCA, TWAP, scheduling

## Tool Output Format

All tools return structured JSON:

```json
{
  "success": true,
  "data": {
    "price": 3500.00,
    "change24h": 2.5,
    "volume24h": 15000000000
  },
  "metadata": {
    "source": "coingecko",
    "timestamp": 1706300000
  }
}
```
