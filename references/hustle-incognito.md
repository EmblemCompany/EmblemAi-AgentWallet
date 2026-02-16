# hustle-incognito

Low-level SDK for communicating with Emblem's AI Agent API. Foundation for `@emblemvault/hustle-react`.

## Installation

```bash
npm install hustle-incognito
```

## Initialization

### With API Key (Server-side)

```typescript
import { HustleIncognito } from 'hustle-incognito';

const client = new HustleIncognito({
  apiKey: process.env.EMBLEM_API_KEY,
  apiUrl: 'https://api.emblem.vault'
});
```

### With Auth SDK (Browser)

```typescript
import { EmblemAuthSDK } from '@emblemvault/auth-sdk';
import { HustleIncognito } from 'hustle-incognito';

const auth = new EmblemAuthSDK({ appId: 'your-app-id' });
const client = new HustleIncognito({ auth });

// Client automatically uses auth session and refreshes tokens
```

### With JWT Token

```typescript
const client = new HustleIncognito({
  token: 'jwt-token-here',
  apiUrl: 'https://api.emblem.vault'
});
```

## Chat Methods

### Simple Request/Response

```typescript
const response = await client.chat([
  { role: 'user', content: 'What tokens are trending on Base?' }
]);

console.log(response.content);
// "Based on current data, the trending tokens on Base are..."

console.log(response.toolCalls);
// [{ name: 'get_trending_tokens', arguments: { chain: 'base' }, result: {...} }]
```

### Streaming (Processed)

```typescript
for await (const chunk of client.chatStream({
  messages: [{ role: 'user', content: 'Analyze ETH price' }],
  processChunks: true
})) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }

  if (chunk.toolCall) {
    console.log('\nTool called:', chunk.toolCall.name);
  }

  if (chunk.toolResult) {
    console.log('Tool result:', chunk.toolResult);
  }
}
```

### Raw API Stream

```typescript
const stream = await client.rawStream({
  messages: [{ role: 'user', content: 'Show my portfolio' }]
});

for await (const event of stream) {
  // Raw SSE events from API
  console.log(event.type, event.data);
}
```

## Chat Options

```typescript
const response = await client.chat(messages, {
  model: 'gpt-4',                    // AI model to use
  systemPrompt: 'You are a...',      // System prompt
  skipServerPrompt: false,           // Skip server-side prompt
  temperature: 0.7,                  // Response randomness (0-1)
  maxTokens: 4096,                   // Max response length
  tools: ['trading', 'analysis'],    // Enable specific tool categories
  timeout: 30000                     // Request timeout (ms)
});
```

## Available Tools

The AI has access to 25+ built-in crypto tools:

### Trading & Swaps
- Token swaps (DEX aggregation)
- Cross-chain bridges
- Limit orders
- Stop loss orders

### Market Research
- Real-time prices
- Technical analysis (RSI, MACD, Bollinger)
- Social sentiment
- Trending tokens
- Price charts

### DeFi
- Liquidity pool analysis
- Yield farming opportunities
- Protocol TVL data
- Gas optimization

### Token Analysis
- Security audits (honeypot, rug pull detection)
- Whale tracking
- Holder distribution
- Contract verification

### Portfolio
- Balance queries
- Position tracking
- P&L calculations
- Multi-chain aggregation

```typescript
// Get available tool categories
const tools = await client.getTools();
// ['trading', 'market', 'defi', 'analysis', 'portfolio', ...]
```

## File Uploads

```typescript
// Upload image for analysis
const fileRef = await client.uploadFile('/path/to/chart.png');

const response = await client.chat([
  {
    role: 'user',
    content: 'Analyze this chart',
    attachments: [fileRef]
  }
]);
```

## Custom Plugins

Extend the AI with your own tools:

```typescript
client.use({
  name: 'my-plugin',
  version: '1.0.0',
  tools: [{
    name: 'get_nft_floor',
    description: 'Get floor price for NFT collection',
    parameters: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'Collection name or contract address'
        },
        chain: {
          type: 'string',
          enum: ['ethereum', 'base', 'polygon'],
          default: 'ethereum'
        }
      },
      required: ['collection']
    }
  }],
  executors: {
    get_nft_floor: async ({ collection, chain }) => {
      const data = await fetchNFTFloor(collection, chain);
      return {
        collection: data.name,
        floor: data.floorPrice,
        currency: data.currency,
        change24h: data.change
      };
    }
  },
  hooks: {
    beforeRequest: async (messages) => {
      // Modify messages before sending
      return messages;
    },
    afterResponse: async (response) => {
      // Process response
      return response;
    },
    onError: async (error) => {
      // Handle errors
      console.error('Plugin error:', error);
    }
  }
});
```

## Events

```typescript
// Tool execution events
client.on('tool_call', (toolCall) => {
  console.log('Calling tool:', toolCall.name, toolCall.arguments);
});

client.on('tool_result', (result) => {
  console.log('Tool result:', result);
});

// Limit events
client.on('max_tools_reached', () => {
  console.log('Max tool calls reached for this request');
});

// Error events
client.on('timeout', () => {
  console.log('Request timed out');
});

client.on('auto_retry', (attempt) => {
  console.log('Retrying request, attempt:', attempt);
});
```

## Conversation Management

```typescript
// Conversations auto-summarize when context grows too large
const response = await client.chat(longConversation, {
  autoSummarize: true,      // Enable auto-summarization
  maxContextTokens: 8000    // Trigger summarization above this
});

// Access conversation summary
console.log(response.summary);
```

## Multi-Model Support

```typescript
// List available models
const models = await client.getModels();
// ['gpt-4', 'gpt-3.5-turbo', 'claude-3', ...]

// Use specific model
const response = await client.chat(messages, {
  model: 'claude-3'
});
```

## Error Handling

```typescript
try {
  const response = await client.chat(messages);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await sleep(error.retryAfter);
  } else if (error.code === 'AUTH_EXPIRED') {
    // Re-authenticate
    await auth.refreshSession();
  } else if (error.code === 'TOOL_ERROR') {
    // Tool execution failed
    console.error('Tool failed:', error.toolName, error.message);
  }
}
```

## CLI Usage

```bash
# Set environment variables
export EMBLEM_API_KEY=your-api-key
export EMBLEM_API_URL=https://api.emblem.vault

# Use in scripts
node -e "
const { HustleIncognito } = require('hustle-incognito');
const client = new HustleIncognito({ apiKey: process.env.EMBLEM_API_KEY });
client.chat([{ role: 'user', content: 'What is ETH price?' }])
  .then(r => console.log(r.content));
"
```

## TypeScript Types

```typescript
import type {
  HustleIncognito,
  HustleConfig,
  ChatMessage,
  ChatResponse,
  StreamChunk,
  Plugin,
  Tool,
  ToolCall,
  ToolResult
} from 'hustle-incognito';
```
