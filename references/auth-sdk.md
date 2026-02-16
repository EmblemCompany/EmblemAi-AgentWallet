# @emblemvault/auth-sdk

Core authentication SDK for multi-chain wallet authentication and session management.

## Installation

```bash
npm install @emblemvault/auth-sdk
```

## Initialization

```typescript
import { EmblemAuthSDK } from '@emblemvault/auth-sdk';

const auth = new EmblemAuthSDK({
  appId: 'your-app-id',           // Required: from emblem.vault/register
  authUrl: 'https://auth.emblem.vault',  // Optional: custom auth URL
  modalMode: 'iframe',            // Optional: 'iframe' | 'popup' (default: 'iframe')
  storage: customStorage          // Optional: custom storage adapter
});
```

## Authentication Methods

### Modal-Based (Browser)

```typescript
// Open auth modal - user selects wallet and signs
auth.openAuthModal();

// Listen for successful auth
auth.on('session', (session) => {
  console.log('Authenticated:', session.user.vaultId);
});
```

### Programmatic Wallet Auth

```typescript
// For custom wallet flows
const session = await auth.authenticateWallet({
  network: 'ethereum',  // 'ethereum' | 'solana' | 'bitcoin' | 'hedera'
  address: '0x...',
  message: 'Sign to authenticate',
  signature: '0x...'
});
```

### OAuth

```typescript
// Initiate OAuth flow
auth.authenticateOAuth('google');  // or 'twitter'
```

### Email/Password

```typescript
// Request OTP
await auth.requestOtp(email);

// Verify OTP
const session = await auth.verifyOtp(email, otpCode);
```

## Session Management

### Get Current Session

```typescript
const session = await auth.getSession();

if (session) {
  console.log('Token:', session.authToken);
  console.log('Vault ID:', session.user.vaultId);
  console.log('Expires:', new Date(session.expiresAt));
}
```

### Session Structure

```typescript
interface Session {
  authToken: string;        // JWT for API calls
  refreshToken?: string;    // For mobile apps (optional)
  expiresAt: number;        // Unix timestamp (ms)
  user: {
    vaultId: string;        // Unique vault identifier
    identifier?: string;    // Email or wallet address
  };
  appId: string;
}
```

### Manual Refresh

```typescript
// Usually not needed - auto-refresh handles this
const newSession = await auth.refreshSession();
```

### Logout

```typescript
await auth.logout();
```

## Vault Information

```typescript
const vaultInfo = await auth.getVaultInfo();
// Returns:
// {
//   evmAddress: '0x...',
//   solanaAddress: '...',
//   hederaAccountId: '0.0.xxx'
// }

// Get API key for vault operations
const apiKey = await auth.getVaultApiKey();
```

## Events

```typescript
// Session events
auth.on('session', (session) => {
  // New session established
});

auth.on('sessionExpired', () => {
  // Session expired, prompt re-auth
});

auth.on('sessionRefreshed', (session) => {
  // Session was auto-refreshed
});

// Modal events
auth.on('modalOpened', () => {});
auth.on('modalClosed', () => {});

// Error events
auth.on('error', (error) => {
  console.error('Auth error:', error);
});

// Remove listener
const unsubscribe = auth.on('session', handler);
unsubscribe();
```

## Custom Storage

For server-side or custom persistence:

```typescript
const auth = new EmblemAuthSDK({
  appId: 'your-app-id',
  storage: {
    get: async (key: string) => {
      return await redis.get(`emblem:${key}`);
    },
    set: async (key: string, value: string) => {
      await redis.set(`emblem:${key}`, value);
    },
    remove: async (key: string) => {
      await redis.del(`emblem:${key}`);
    }
  }
});
```

## Supported Networks

| Network | Signature Type | Libraries |
|---------|---------------|-----------|
| Ethereum/EVM | EIP-191 personal_sign | viem, ethers, web3.js |
| Solana | ed25519 | @solana/web3.js |
| Bitcoin | ECDSA (message) | Native |
| Hedera | ed25519 | @hashgraph/sdk |

## Error Handling

```typescript
try {
  await auth.authenticateWallet(params);
} catch (error) {
  if (error.code === 'INVALID_SIGNATURE') {
    // Signature verification failed
  } else if (error.code === 'NETWORK_ERROR') {
    // Network connectivity issue
  } else if (error.code === 'SESSION_EXPIRED') {
    // Session expired, need re-auth
  }
}
```

## CDN Usage

```html
<script src="https://cdn.emblem.vault/auth-sdk.min.js"></script>
<script>
  const auth = new EmblemAuthSDK({ appId: 'your-app-id' });
  auth.openAuthModal();
</script>
```

## TypeScript Types

```typescript
import type {
  EmblemAuthSDK,
  Session,
  AuthConfig,
  VaultInfo,
  AuthEvent
} from '@emblemvault/auth-sdk';
```
