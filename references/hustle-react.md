# @emblemvault/hustle-react

React components and hooks for AI chat powered by Hustle.

## Installation

```bash
npm install @emblemvault/hustle-react @emblemvault/emblem-auth-react
```

## Setup

```tsx
import { EmblemAuthProvider } from '@emblemvault/emblem-auth-react';
import { HustleProvider } from '@emblemvault/hustle-react';

function App() {
  return (
    <EmblemAuthProvider appId="your-app-id">
      <HustleProvider>
        {children}
      </HustleProvider>
    </EmblemAuthProvider>
  );
}
```

### Provider Props

```tsx
<HustleProvider
  instanceId="main"              // Optional: for multiple instances
  defaultModel="gpt-4"           // Optional: default AI model
  defaultSystemPrompt="..."      // Optional: system prompt
>
```

## Hooks

### useHustle

Main hook for AI chat functionality.

```tsx
import { useHustle } from '@emblemvault/hustle-react';

function ChatComponent() {
  const {
    // State
    isReady,            // boolean - SDK initialized
    isLoading,          // boolean - request in progress
    error,              // Error | null
    models,             // string[] - available models

    // Chat methods
    chat,               // (messages, options?) => Promise<Response>
    chatStream,         // (options) => AsyncIterator<Chunk>
    uploadFile,         // (file) => Promise<FileRef>

    // Settings
    selectedModel,      // string
    setSelectedModel,   // (model) => void
    systemPrompt,       // string
    setSystemPrompt,    // (prompt) => void

    // Plugins
    registerPlugin,     // (plugin) => Promise<void>
    plugins,            // Plugin[]

    // SDK access
    client              // HustleIncognito instance
  } = useHustle();
}
```

### Basic Chat

```tsx
function SimpleChat() {
  const { chat, isLoading } = useHustle();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const response = await chat([...messages, userMessage]);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.content
    }]);
  };

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i} className={m.role}>{m.content}</div>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading}>
        Send
      </button>
    </div>
  );
}
```

### Streaming Chat

```tsx
function StreamingChat() {
  const { chatStream } = useHustle();
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (message) => {
    setResponse('');
    setIsStreaming(true);

    for await (const chunk of chatStream({
      messages: [{ role: 'user', content: message }],
      processChunks: true
    })) {
      if (chunk.content) {
        setResponse(prev => prev + chunk.content);
      }
    }

    setIsStreaming(false);
  };

  return (
    <div>
      <div>{response}</div>
      {isStreaming && <Spinner />}
    </div>
  );
}
```

### useSpeechRecognition

Voice input via Web Speech API.

```tsx
import { useSpeechRecognition } from '@emblemvault/hustle-react';

function VoiceInput() {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported
  } = useSpeechRecognition();

  if (!isSupported) return <p>Speech not supported</p>;

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'} Listening
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

### usePlugins

Manage custom AI tool plugins.

```tsx
import { usePlugins } from '@emblemvault/hustle-react';

function PluginManager() {
  const { plugins, registerPlugin, unregisterPlugin } = usePlugins();

  const addWeatherPlugin = async () => {
    await registerPlugin({
      name: 'weather',
      version: '1.0.0',
      tools: [{
        name: 'get_weather',
        description: 'Get current weather for a city',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' }
          },
          required: ['city']
        }
      }],
      executors: {
        get_weather: async ({ city }) => {
          const data = await fetchWeather(city);
          return { temperature: data.temp, conditions: data.weather };
        }
      }
    });
  };

  return (
    <div>
      <h3>Active Plugins</h3>
      {plugins.map(p => (
        <div key={p.name}>
          {p.name} v{p.version}
          <button onClick={() => unregisterPlugin(p.name)}>Remove</button>
        </div>
      ))}
      <button onClick={addWeatherPlugin}>Add Weather Plugin</button>
    </div>
  );
}
```

## Components

### HustleChat

Full-featured chat interface.

```tsx
import { HustleChat } from '@emblemvault/hustle-react';

// Basic usage
<HustleChat />

// With customization
<HustleChat
  placeholder="Ask anything about crypto..."
  showSettings          // Show settings modal button
  showModelSelector     // Show model dropdown
  showVoiceInput        // Show microphone button
  maxHeight="500px"
  className="my-chat"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | string | "Type a message..." | Input placeholder |
| `showSettings` | boolean | true | Show settings button |
| `showModelSelector` | boolean | true | Show model dropdown |
| `showVoiceInput` | boolean | true | Show mic button |
| `maxHeight` | string | "600px" | Max chat height |
| `onMessage` | function | - | Callback on new message |

### HustleChatWidget

Floating chat widget for site-wide integration.

```tsx
import { HustleChatWidget } from '@emblemvault/hustle-react';

// Add to your layout
<HustleChatWidget
  position="bottom-right"    // or 'bottom-left'
  buttonLabel="Chat"
  defaultOpen={false}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | string | "bottom-right" | Widget position |
| `buttonLabel` | string | "Chat" | Toggle button text |
| `defaultOpen` | boolean | false | Start open |
| `zIndex` | number | 9999 | CSS z-index |

## File Uploads

```tsx
function ImageChat() {
  const { chat, uploadFile } = useHustle();
  const [image, setImage] = useState(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    const fileRef = await uploadFile(file);
    setImage(fileRef);
  };

  const handleSubmit = async () => {
    const response = await chat([
      {
        role: 'user',
        content: 'What is in this image?',
        attachments: [image]
      }
    ]);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageSelect} />
      {image && <button onClick={handleSubmit}>Analyze Image</button>}
    </div>
  );
}
```

## Tool Call Tracking

```tsx
function ChatWithTools() {
  const { chatStream } = useHustle();
  const [toolCalls, setToolCalls] = useState([]);

  const handleSubmit = async (message) => {
    for await (const chunk of chatStream({
      messages: [{ role: 'user', content: message }]
    })) {
      if (chunk.toolCall) {
        setToolCalls(prev => [...prev, {
          name: chunk.toolCall.name,
          args: chunk.toolCall.arguments,
          status: 'executing'
        }]);
      }

      if (chunk.toolResult) {
        setToolCalls(prev => prev.map(tc =>
          tc.name === chunk.toolResult.name
            ? { ...tc, result: chunk.toolResult.result, status: 'complete' }
            : tc
        ));
      }
    }
  };

  return (
    <div>
      <h3>Tool Executions</h3>
      {toolCalls.map((tc, i) => (
        <div key={i}>
          {tc.name}: {tc.status}
          {tc.result && <pre>{JSON.stringify(tc.result, null, 2)}</pre>}
        </div>
      ))}
    </div>
  );
}
```

## Multiple Instances

```tsx
// Separate chat instances with independent state
<HustleProvider instanceId="trading-chat">
  <HustleChat />
</HustleProvider>

<HustleProvider instanceId="support-chat">
  <HustleChat />
</HustleProvider>
```

## TypeScript

```tsx
import type {
  HustleProviderProps,
  UseHustleReturn,
  HustleChatProps,
  Plugin,
  ChatMessage,
  StreamChunk
} from '@emblemvault/hustle-react';
```
