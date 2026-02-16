# reflexive

AI-powered introspection for Node.js apps. Embed Claude inside your running application to monitor, debug, and develop with conversational AI. Like Puppeteer but for the CLI -- it sees logs, reads source, edits files, sets breakpoints, and responds to runtime events.

## Installation

```bash
npm install reflexive
```

Or run directly:

```bash
npx reflexive ./server.js
```

**Requires:** Node.js >= 18. Claude authentication via `claude auth login` (Claude Code CLI) or `ANTHROPIC_API_KEY` env var.

## Quick Start

### CLI -- Monitor an App

```bash
# Read-only monitoring (default -- safe)
npx reflexive ./server.js

# Full development mode
npx reflexive --write --shell --watch --debug ./server.js

# Python app
npx reflexive --debug ./app.py

# Pass args to your app
npx reflexive ./server.js -- --port 8080
```

### Library -- Embed in Your App

```typescript
import { makeReflexive } from 'reflexive';

const r = makeReflexive();

// Expose state to the AI
r.setState('users.active', 42);

// Chat programmatically
const analysis = await r.chat('Summarize the app state');
```

### MCP Server -- Use with Claude Code

```bash
npx reflexive --mcp --write --shell --debug ./server.js
```

## Safety Model

**Default is read-only.** Capabilities are explicitly opted into via flags:

| Flag | Enables |
|------|---------|
| `--write` | File modification |
| `--shell` | Shell command execution |
| `--inject` | Deep instrumentation (Node.js: console intercept, HTTP tracking, GC events) |
| `--eval` | Runtime code evaluation (Node.js only, DANGEROUS) |
| `--debug` | Multi-language debugging (breakpoints, stepping, scope inspection) |
| `--watch` | Auto-restart on file changes |
| `--dangerously-skip-permissions` | Enable everything |

No flags = agent can see logs, read files, and ask questions. Cannot modify anything.

## Operating Modes

### Local Mode (Default)

Spawns your app as a child process with full monitoring:

```bash
npx reflexive ./server.js
```

Opens a web dashboard at `http://localhost:3099` with live logs, chat, process controls, and breakpoint management.

### Library Mode

Embed directly in your Node.js/TypeScript app:

```typescript
import { makeReflexive } from 'reflexive';

const r = makeReflexive({
  webUI: true,
  port: 3099,
  title: 'My App',
  systemPrompt: 'You are monitoring a payment system.',
  tools: [
    {
      name: 'get_user_count',
      description: 'Get number of active users',
      schema: { type: 'object', properties: {} },
      handler: async () => ({
        content: [{ type: 'text', text: `Active users: ${getUserCount()}` }]
      })
    }
  ]
});

// Expose state
r.setState('payments.processed', 1234);

// Log events
r.log('info', 'Payment processed');

// Chat with the AI
const insight = await r.chat('Any anomalies in recent payments?');
```

When run via CLI (`reflexive app.js`), library mode auto-connects to the parent process via env vars. When run standalone (`node app.js`), it works independently.

### Sandbox Mode

Runs apps in isolated Vercel Sandbox with snapshot/restore:

```bash
npx reflexive --sandbox ./server.js
```

### MCP Server Mode

Run as stdio-based MCP server for external AI agents:

```bash
npx reflexive --mcp --write --shell --debug ./server.js
```

Works with Claude Code, Claude Desktop, ChatGPT. Supports dynamic app switching via `run_app` tool without restart.

### Hosted Mode

Multi-tenant deployment with REST API for programmatic sandbox management, snapshot storage, and restoration.

## Library API

### makeReflexive(options?)

```typescript
interface MakeReflexiveOptions {
  webUI?: boolean;           // Enable web dashboard (default: false)
  port?: number;             // Dashboard port (default: 3099)
  title?: string;            // Dashboard title
  systemPrompt?: string;     // Additional system prompt for AI
  tools?: CustomTool[];      // Custom MCP tools
  onReady?: (info) => void;  // Callback when ready
}

interface ReflexiveInstance {
  appState: AppState;
  server: Server | null;     // null if webUI disabled
  log: (type: string, message: string) => void;
  setState: (key: string, value: unknown) => void;
  getState: (key?: string) => unknown;
  chat: (message: string) => Promise<string>;
}
```

### AppState

Manages log buffer and custom state:

```typescript
class AppState {
  log(type: LogType, message: string, meta?: Record<string, unknown>): void
  getLogs(count?: number, filter?: string): LogEntry[]
  searchLogs(query: string): LogEntry[]
  clearLogs(): void
  setState(key: string, value: unknown): void
  getState(key?: string): unknown
  getStatus(): AppStatus
  on(event: string, handler: EventHandler): void
  off(event: string, handler: EventHandler): void
  emit(event: string, data: unknown): void
}
```

### ProcessManager

Manages a child process:

```typescript
class ProcessManager {
  async start(): Promise<void>
  async stop(): Promise<void>
  async restart(): Promise<void>
  async sendInput(text: string): Promise<void>
  getState(): ProcessState
  on(event: string, handler: EventHandler): void
}
```

### SandboxManager

Manages a single Vercel Sandbox:

```typescript
class SandboxManager {
  async create(): Promise<void>
  async uploadFiles(files: SandboxFile[]): Promise<void>
  async start(entryFile: string, args?: string[]): Promise<void>
  async stop(): Promise<void>
  async readFile(path: string): Promise<string>
  async writeFile(path: string, content: string): Promise<void>
  getDomain(port: number): string | null
  async runCommand(cmd: string, args?: string[]): Promise<CommandResult>
}
```

### RemoteDebugger

V8 Inspector protocol client:

```typescript
class RemoteDebugger {
  async connect(port: number): Promise<void>
  async disconnect(): Promise<void>
  async setBreakpoint(file: string, line: number): Promise<string>
  async removeBreakpoint(id: string): Promise<void>
  async listBreakpoints(): Promise<BreakpointInfo[]>
  async resume(): Promise<void>
  async pause(): Promise<void>
  async stepOver(): Promise<void>
  async stepInto(): Promise<void>
  async stepOut(): Promise<void>
  async getCallStack(): Promise<CallFrame[]>
  async evaluate(expression: string): Promise<unknown>
  async getScopeVariables(): Promise<ScopeInfo[]>
}
```

### MultiSandboxManager

Manages multiple sandboxes for hosted mode:

```typescript
class MultiSandboxManager {
  async create(id: string, config?): Promise<SandboxInstance>
  async start(id: string, entryFile: string, args?: string[]): Promise<void>
  async stop(id: string): Promise<void>
  async destroy(id: string): Promise<void>
  async snapshot(id: string, options?): Promise<{ snapshotId: string }>
  async resume(snapshotId: string, options?): Promise<{ id: string }>
  list(): SandboxInstance[]
  get(id: string): SandboxInstance | undefined
}
```

## MCP Tools

Tools available to the embedded AI agent:

### File Tools

| Tool | Description | Requires |
|------|-------------|----------|
| `read_file` | Read file contents | -- |
| `list_directory` | List directory contents | -- |
| `search_files` | Search by glob pattern | -- |
| `write_file` | Write/create file | `--write` |
| `edit_file` | Edit file by string replacement | `--write` |

### Process Tools

| Tool | Description |
|------|-------------|
| `get_process_state` | Get current process state |
| `get_output_logs` | Retrieve stdout/stderr logs |
| `restart_process` | Restart the app |
| `stop_process` | Stop the app |
| `start_process` | Start a stopped app |
| `send_input` | Send stdin to interactive apps |
| `search_logs` | Search through logs |
| `run_app` | Start or switch apps (MCP mode) |

### Debug Tools (with `--debug`)

Multi-language debugging via V8 Inspector (Node.js) and Debug Adapter Protocol (Python, Go, .NET, Rust):

| Tool | Description |
|------|-------------|
| `debug_set_breakpoint` | Set breakpoint at file:line (supports condition and AI prompt) |
| `debug_remove_breakpoint` | Remove breakpoint by ID |
| `debug_list_breakpoints` | List all breakpoints |
| `debug_resume` | Resume from breakpoint |
| `debug_pause` | Pause execution |
| `debug_step_over` | Step over current line |
| `debug_step_into` | Step into function |
| `debug_step_out` | Step out of function |
| `debug_get_call_stack` | Get current call stack |
| `debug_evaluate` | Evaluate expression in scope |
| `debug_get_scope_variables` | Get variables in scope |

### Eval Tools (with `--eval`, Node.js only)

| Tool | Description |
|------|-------------|
| `evaluate_in_app` | Execute JavaScript in running app |
| `list_app_globals` | List global variables |

## Multi-Language Debugging

| Language | Extensions | Debugger | Install |
|----------|-----------|----------|---------|
| Node.js | `.js`, `.ts` | V8 Inspector | Built-in |
| Python | `.py` | debugpy | `pip install debugpy` |
| Go | `.go` | Delve | `go install github.com/go-delve/delve/cmd/dlv@latest` |
| .NET | `.cs` | netcoredbg | [releases](https://github.com/Samsung/netcoredbg/releases) |
| Rust | `.rs` | CodeLLDB | `cargo install codelldb` |

### Breakpoint Prompts

Attach AI prompts to breakpoints that trigger automatically when hit:

```bash
# In the dashboard or via MCP tool:
debug_set_breakpoint: file="app.py", line=25, prompt="Analyze this request object"
```

When the breakpoint is hit, the AI receives the prompt along with the call stack and scope variables.

## CLI Reference

```
reflexive [options] [entry-file] [-- app-args...]
```

| Option | Description |
|--------|-------------|
| `-p, --port <port>` | Dashboard port (default: 3099) |
| `-h, --host <host>` | Dashboard host (default: localhost) |
| `-o, --open` | Open dashboard in browser |
| `-w, --watch` | Restart on file changes |
| `-i, --interactive` | Proxy stdin/stdout for CLI apps |
| `--mcp` | Run as MCP server |
| `--no-webui` | Disable web dashboard (MCP mode) |
| `--inject` | Deep instrumentation (Node.js only) |
| `--eval` | Runtime eval (Node.js only, DANGEROUS) |
| `-d, --debug` | Multi-language debugging |
| `--write` | Enable file writing |
| `--shell` | Enable shell access |
| `--sandbox` | Run in isolated Vercel Sandbox |
| `--node-args <args>` | Pass args to Node.js |
| `--dangerously-skip-permissions` | Enable everything |

## Injection Mode (Node.js Only)

With `--inject`, Node.js apps get automatic instrumentation:

| Captured | Source |
|----------|--------|
| Console methods | log, info, warn, error, debug |
| HTTP requests | Incoming/outgoing via diagnostics_channel |
| GC events | Duration and type |
| Event loop | Latency histogram (p50, p99) |
| Uncaught errors | With stack traces |

Apps can opt into the injected API:

```javascript
if (process.reflexive) {
  process.reflexive.setState('db.connections', pool.size);
  process.reflexive.emit('userSignup', { userId: 123 });
}
```

## Custom Tools

Extend the agent with your own tools:

```typescript
const r = makeReflexive({
  tools: [
    {
      name: 'query_database',
      description: 'Run a read-only SQL query',
      schema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query to execute' }
        },
        required: ['sql']
      },
      handler: async ({ sql }) => ({
        content: [{ type: 'text', text: JSON.stringify(await db.query(sql)) }]
      })
    }
  ]
});
```

## Configuration

Config file: `reflexive.config.js` or `reflexive.config.ts`

```javascript
export default {
  mode: 'local',  // 'local', 'sandbox', 'hosted'
  port: 3099,
  capabilities: {
    readFiles: true,
    writeFiles: true,
    shellAccess: false,
    restart: true,
    inject: false,
    eval: false,
    debug: false
  }
};
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (alternative to `claude auth login`) |
| `REFLEXIVE_CLI_MODE` | Set by CLI when running child process |
| `REFLEXIVE_CLI_PORT` | Port for CLI-to-library communication |

## Types

```typescript
type LogType = 'info' | 'warn' | 'error' | 'debug' | 'stdout' | 'stderr' | 'system' | 'stdin' | 'breakpoint-prompt';

interface LogEntry {
  type: LogType | string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface ProcessState {
  isRunning: boolean;
  pid: number | null;
  uptime: number;
  restartCount: number;
  exitCode: number | null;
  entry: string;
  cwd: string;
  interactive: boolean;
  inject: boolean;
  debug: boolean;
  debuggerConnected: boolean;
  debuggerPaused: boolean;
  inspectorUrl: string | null;
}

interface AppStatus {
  pid: number;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  customState: Record<string, unknown>;
  startTime: number;
}

interface Capabilities {
  readFiles: boolean;
  writeFiles: boolean;
  shellAccess: boolean;
  restart: boolean;
  inject: boolean;
  eval: boolean;
  debug: boolean;
}

type SandboxStatus = 'created' | 'running' | 'stopped' | 'error';

interface SandboxInstance {
  id: string;
  status: SandboxStatus;
  config: SandboxConfig;
  createdAt: number;
  startedAt?: number;
}
```

## REST API (Hosted Mode)

Authentication via Bearer token in `Authorization` header.

### Sandbox Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sandboxes` | Create sandbox |
| `GET` | `/api/sandboxes` | List sandboxes |
| `GET` | `/api/sandboxes/:id` | Get sandbox details |
| `POST` | `/api/sandboxes/:id/start` | Start sandbox |
| `POST` | `/api/sandboxes/:id/stop` | Stop sandbox |
| `DELETE` | `/api/sandboxes/:id` | Destroy sandbox |
| `GET` | `/api/sandboxes/:id/domain/:port` | Get public URL |

### Snapshot Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sandboxes/:id/snapshot` | Create snapshot |
| `GET` | `/api/snapshots` | List snapshots |
| `POST` | `/api/snapshots/:id/resume` | Resume from snapshot |
| `DELETE` | `/api/snapshots/:id` | Delete snapshot |

### File & Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sandboxes/:id/files/*` | Read file |
| `PUT` | `/api/sandboxes/:id/files/*` | Write file |
| `POST` | `/api/sandboxes/:id/chat` | Chat with agent (SSE stream) |

## Patterns

### AI-Powered API Endpoint

```typescript
import { makeReflexive } from 'reflexive';
import http from 'http';

const r = makeReflexive({ title: 'Story API' });

http.createServer(async (req, res) => {
  if (req.url?.startsWith('/story/')) {
    const topic = decodeURIComponent(req.url.slice(7));
    const story = await r.chat(`Write a short story about: ${topic}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ story }));
  }
}).listen(8080);
```

### Self-Monitoring Express App

```typescript
import express from 'express';
import { makeReflexive } from 'reflexive';

const app = express();
const r = makeReflexive({ webUI: true, title: 'Express Monitor' });

let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  r.setState('requests.total', requestCount);
  r.log('info', `${req.method} ${req.url}`);
  next();
});

app.get('/health', async (req, res) => {
  const analysis = await r.chat('Give a brief health summary');
  res.json({ status: 'ok', analysis });
});

app.listen(3000);
```

### Debugging a Python App

```bash
# Install debugpy
pip install debugpy

# Run with debugging enabled
npx reflexive --debug ./app.py

# In the dashboard chat:
# "Set a breakpoint at app.py:42 and analyze the request when it hits"
```
