# React Components Reference

Complete reference for all Emblem AI React components.

## Authentication Components

### ConnectButton

Wallet connect/disconnect button with optional vault info.

```tsx
import { ConnectButton } from '@emblemvault/emblem-auth-react';

// Basic
<ConnectButton />

// With vault dropdown
<ConnectButton showVaultInfo />

// Custom labels
<ConnectButton
  connectLabel="Sign In"
  disconnectLabel="Sign Out"
/>

// Custom styling
<ConnectButton
  className="my-btn"
  style={{ borderRadius: '8px' }}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showVaultInfo` | `boolean` | `false` | Show vault addresses in dropdown |
| `connectLabel` | `string` | `"Connect"` | Button text when disconnected |
| `disconnectLabel` | `string` | `"Disconnect"` | Button text when connected |
| `className` | `string` | - | CSS class name |
| `style` | `CSSProperties` | - | Inline styles |
| `disabled` | `boolean` | `false` | Disable the button |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Button style |
| `onConnect` | `() => void` | - | Callback when connected |
| `onDisconnect` | `() => void` | - | Callback when disconnected |

### AuthStatus

Displays current authentication status with wallet/vault info.

```tsx
import { AuthStatus } from '@emblemvault/emblem-auth-react';

<AuthStatus />
// Renders: Address | Vault ID | Logout button
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showAddress` | `boolean` | `true` | Show wallet address |
| `showVaultId` | `boolean` | `true` | Show vault ID |
| `showLogout` | `boolean` | `true` | Show logout button |
| `truncateAddress` | `boolean` | `true` | Truncate address (0x1234...5678) |
| `className` | `string` | - | CSS class name |

## AI Chat Components

### HustleChat

Full-featured chat interface.

```tsx
import { HustleChat } from '@emblemvault/hustle-react';

// Basic
<HustleChat />

// Customized
<HustleChat
  placeholder="Ask about crypto..."
  showSettings
  showModelSelector
  showVoiceInput
  maxHeight="500px"
/>

// With callbacks
<HustleChat
  onMessage={(msg) => console.log('New message:', msg)}
  onError={(err) => console.error('Chat error:', err)}
  onToolCall={(tool) => console.log('Tool called:', tool)}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Type a message..."` | Input placeholder |
| `showSettings` | `boolean` | `true` | Show settings button |
| `showModelSelector` | `boolean` | `true` | Show model dropdown |
| `showVoiceInput` | `boolean` | `true` | Show microphone button |
| `showFileUpload` | `boolean` | `true` | Show file upload button |
| `maxHeight` | `string` | `"600px"` | Max chat container height |
| `className` | `string` | - | CSS class name |
| `style` | `CSSProperties` | - | Inline styles |
| `onMessage` | `(msg: ChatMessage) => void` | - | New message callback |
| `onError` | `(error: Error) => void` | - | Error callback |
| `onToolCall` | `(tool: ToolCall) => void` | - | Tool execution callback |
| `initialMessages` | `ChatMessage[]` | `[]` | Pre-populate messages |
| `systemPrompt` | `string` | - | Override system prompt |

### HustleChatWidget

Floating chat widget for site-wide integration.

```tsx
import { HustleChatWidget } from '@emblemvault/hustle-react';

// Basic
<HustleChatWidget />

// Customized
<HustleChatWidget
  position="bottom-right"
  buttonLabel="Chat"
  buttonIcon={<ChatIcon />}
  defaultOpen={false}
  zIndex={9999}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Widget position |
| `buttonLabel` | `string` | `"Chat"` | Toggle button text |
| `buttonIcon` | `ReactNode` | - | Custom button icon |
| `defaultOpen` | `boolean` | `false` | Start with chat open |
| `zIndex` | `number` | `9999` | CSS z-index |
| `width` | `string` | `"380px"` | Chat panel width |
| `height` | `string` | `"500px"` | Chat panel height |
| `offset` | `{ x: number, y: number }` | `{ x: 20, y: 20 }` | Position offset |

## Provider Components

### EmblemAuthProvider

Authentication context provider.

```tsx
import { EmblemAuthProvider } from '@emblemvault/emblem-auth-react';

<EmblemAuthProvider
  appId="your-app-id"
  authUrl="https://auth.emblem.vault"
  modalMode="iframe"
  onSession={(session) => console.log('Session:', session)}
  onError={(error) => console.error('Auth error:', error)}
>
  {children}
</EmblemAuthProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appId` | `string` | **required** | Your app ID |
| `authUrl` | `string` | Production URL | Auth service URL |
| `modalMode` | `'iframe' \| 'popup'` | `'iframe'` | Modal display mode |
| `onSession` | `(session: Session) => void` | - | Session callback |
| `onError` | `(error: Error) => void` | - | Error callback |
| `storage` | `StorageAdapter` | localStorage | Custom storage |
| `children` | `ReactNode` | **required** | Child components |

### HustleProvider

AI chat context provider.

```tsx
import { HustleProvider } from '@emblemvault/hustle-react';

<HustleProvider
  instanceId="main"
  defaultModel="gpt-4"
  defaultSystemPrompt="You are a helpful crypto assistant."
>
  {children}
</HustleProvider>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `instanceId` | `string` | `"default"` | Instance identifier |
| `defaultModel` | `string` | - | Default AI model |
| `defaultSystemPrompt` | `string` | - | Default system prompt |
| `apiUrl` | `string` | Production URL | API endpoint |
| `children` | `ReactNode` | **required** | Child components |

## Utility Components

### AuthGuard

Conditionally render based on auth state.

```tsx
import { AuthGuard } from '@emblemvault/emblem-auth-react';

<AuthGuard
  fallback={<LoginPrompt />}
  loading={<Spinner />}
>
  <ProtectedContent />
</AuthGuard>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallback` | `ReactNode` | `null` | Shown when not authenticated |
| `loading` | `ReactNode` | `null` | Shown while loading |
| `children` | `ReactNode` | **required** | Shown when authenticated |

### VaultInfo

Display vault addresses.

```tsx
import { VaultInfo } from '@emblemvault/emblem-auth-react';

<VaultInfo />
// Shows: EVM, Solana, Hedera addresses with copy buttons
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showEvm` | `boolean` | `true` | Show EVM address |
| `showSolana` | `boolean` | `true` | Show Solana address |
| `showHedera` | `boolean` | `true` | Show Hedera account ID |
| `copyable` | `boolean` | `true` | Enable copy to clipboard |
| `className` | `string` | - | CSS class name |

## Composition Examples

### Full App Layout

```tsx
function App() {
  return (
    <EmblemAuthProvider appId="your-app-id">
      <HustleProvider>
        <Header />
        <Main />
        <HustleChatWidget />
      </HustleProvider>
    </EmblemAuthProvider>
  );
}

function Header() {
  return (
    <header>
      <Logo />
      <nav>
        <Link to="/">Home</Link>
        <Link to="/portfolio">Portfolio</Link>
      </nav>
      <ConnectButton showVaultInfo />
    </header>
  );
}

function Main() {
  return (
    <AuthGuard fallback={<WelcomeScreen />}>
      <Dashboard />
    </AuthGuard>
  );
}
```

### Embedded Chat

```tsx
function TradingPage() {
  return (
    <div className="trading-layout">
      <div className="chart-section">
        <PriceChart />
      </div>
      <div className="chat-section">
        <HustleChat
          placeholder="Ask about this token..."
          showSettings={false}
          maxHeight="100%"
        />
      </div>
    </div>
  );
}
```

### Multiple Chat Instances

```tsx
function MultiChatApp() {
  return (
    <EmblemAuthProvider appId="your-app-id">
      <div className="chat-panels">
        <HustleProvider instanceId="trading">
          <h3>Trading Assistant</h3>
          <HustleChat />
        </HustleProvider>

        <HustleProvider instanceId="research">
          <h3>Research Assistant</h3>
          <HustleChat />
        </HustleProvider>
      </div>
    </EmblemAuthProvider>
  );
}
```
