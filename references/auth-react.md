# @emblemvault/emblem-auth-react

React hooks and components for Emblem authentication.

## Installation

```bash
npm install @emblemvault/emblem-auth-react
```

## Setup

Wrap your app with the provider:

```tsx
import { EmblemAuthProvider } from '@emblemvault/emblem-auth-react';

function App() {
  return (
    <EmblemAuthProvider appId="your-app-id">
      {children}
    </EmblemAuthProvider>
  );
}
```

### Provider Props

```tsx
<EmblemAuthProvider
  appId="your-app-id"           // Required
  authUrl="https://..."         // Optional: custom auth URL
  modalMode="iframe"            // Optional: 'iframe' | 'popup'
  onSession={(session) => {}}   // Optional: session callback
  onError={(error) => {}}       // Optional: error callback
>
```

## Hooks

### useEmblemAuth

Main hook for authentication state and actions.

```tsx
import { useEmblemAuth } from '@emblemvault/emblem-auth-react';

function MyComponent() {
  const {
    // State
    isAuthenticated,    // boolean
    isLoading,          // boolean
    error,              // Error | null
    session,            // Session | null
    walletAddress,      // string | null
    vaultId,            // string | null

    // Actions
    openAuthModal,      // () => void
    logout,             // () => Promise<void>
    refreshSession,     // () => Promise<Session>

    // SDK access
    authSDK             // EmblemAuthSDK instance
  } = useEmblemAuth();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <button onClick={openAuthModal}>Connect</button>;
  }

  return (
    <div>
      <p>Wallet: {walletAddress}</p>
      <p>Vault: {vaultId}</p>
      <button onClick={logout}>Disconnect</button>
    </div>
  );
}
```

### useEmblemAuthOptional

Same as `useEmblemAuth` but returns `null` if provider not found (instead of throwing).

```tsx
import { useEmblemAuthOptional } from '@emblemvault/emblem-auth-react';

function MaybeAuthComponent() {
  const auth = useEmblemAuthOptional();

  if (!auth) {
    return <div>Auth not available</div>;
  }

  return <div>Authenticated: {auth.isAuthenticated}</div>;
}
```

## Components

### ConnectButton

Pre-styled wallet connect button.

```tsx
import { ConnectButton } from '@emblemvault/emblem-auth-react';

// Basic usage
<ConnectButton />

// With vault dropdown
<ConnectButton showVaultInfo />

// Custom styling
<ConnectButton
  className="my-button"
  style={{ backgroundColor: 'blue' }}
/>

// Custom labels
<ConnectButton
  connectLabel="Sign In"
  disconnectLabel="Sign Out"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showVaultInfo` | boolean | false | Show vault details dropdown |
| `connectLabel` | string | "Connect" | Button text when disconnected |
| `disconnectLabel` | string | "Disconnect" | Button text when connected |
| `className` | string | - | CSS class |
| `style` | CSSProperties | - | Inline styles |

### AuthStatus

Displays current authentication status.

```tsx
import { AuthStatus } from '@emblemvault/emblem-auth-react';

<AuthStatus />
// Shows: wallet address, vault ID, logout button
```

## Patterns

### Protected Route

```tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, openAuthModal } = useEmblemAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <div>
        <p>Please connect to continue</p>
        <button onClick={openAuthModal}>Connect Wallet</button>
      </div>
    );
  }

  return children;
}
```

### Auth-Aware Header

```tsx
function Header() {
  const { isAuthenticated, walletAddress, openAuthModal, logout } = useEmblemAuth();

  return (
    <header>
      <Logo />
      <nav>
        {isAuthenticated ? (
          <>
            <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={openAuthModal}>Connect</button>
        )}
      </nav>
    </header>
  );
}
```

### Get Vault Info

```tsx
function VaultDetails() {
  const { authSDK, isAuthenticated } = useEmblemAuth();
  const [vaultInfo, setVaultInfo] = useState(null);

  useEffect(() => {
    if (isAuthenticated && authSDK) {
      authSDK.getVaultInfo().then(setVaultInfo);
    }
  }, [isAuthenticated, authSDK]);

  if (!vaultInfo) return null;

  return (
    <div>
      <p>EVM: {vaultInfo.evmAddress}</p>
      <p>Solana: {vaultInfo.solanaAddress}</p>
      <p>Hedera: {vaultInfo.hederaAccountId}</p>
    </div>
  );
}
```

### Transaction Signing in React

```tsx
function SendTransaction() {
  const { authSDK, isAuthenticated } = useEmblemAuth();
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!isAuthenticated) return;

    setStatus('Signing...');
    const account = await authSDK.toViemAccount();

    const hash = await walletClient.sendTransaction({
      account,
      to: recipient,
      value: parseEther('0.1')
    });

    setStatus(`Sent: ${hash}`);
  };

  return (
    <div>
      <button onClick={handleSend} disabled={!isAuthenticated}>
        Send 0.1 ETH
      </button>
      <p>{status}</p>
    </div>
  );
}
```

## TypeScript

```tsx
import type {
  EmblemAuthProviderProps,
  UseEmblemAuthReturn,
  ConnectButtonProps
} from '@emblemvault/emblem-auth-react';
```

## With Hustle (AI Chat)

```tsx
import { EmblemAuthProvider } from '@emblemvault/emblem-auth-react';
import { HustleProvider, HustleChat } from '@emblemvault/hustle-react';

function App() {
  return (
    <EmblemAuthProvider appId="your-app-id">
      <HustleProvider>
        <ConnectButton />
        <HustleChat />
      </HustleProvider>
    </EmblemAuthProvider>
  );
}
```

The `HustleProvider` automatically uses the auth context from `EmblemAuthProvider`.
