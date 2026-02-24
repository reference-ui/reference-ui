# Logging Architecture

Date: February 21, 2026  
Status: Proposed

## Philosophy

**Logs are events. Workers emit them, main thread prints them.**

No multi-threaded console conflicts. Clean output. Easy to filter/format.

---

## The Problem

Worker threads share stdout/stderr. Logs can interleave or get lost:

```
[virtual:worker] Processidebug [panda] Starting...ng files...
[virtualdebug [panda] Done:worker] Done
```

Messy. Unreliable.

---

## The Solution

Workers emit log events. Main thread coordinates output:

```
Worker Thread          Event Bus          Main Thread
     │                     │                    │
     ├─ emit('log:debug')─>│                    │
     │                     ├─────────────────>  │
     │                     │                console.log()
     │                     │                    │
```

Clean. Ordered. Reliable.

---

## Core API (`cli/log.ts`)

Simple logger that emits events:

```ts
// cli/log.ts
import pc from 'picocolors'
import { emit } from './event-bus'

type LogLevel = 'info' | 'error' | 'debug'

interface LogPayload {
  level: LogLevel
  message: string
  args: unknown[]
}

let isDebug = false

export const log = {
  info: (...args: unknown[]) => {
    emit('log:info', { level: 'info', args })
  },

  error: (...args: unknown[]) => {
    emit('log:error', { level: 'error', args })
  },

  debug: (...args: unknown[]) => {
    if (!isDebug) return
    emit('log:debug', { level: 'debug', args })
  },

  setDebug: (enabled: boolean) => {
    isDebug = enabled
  },
}

export function initLog(config: { debug?: boolean }) {
  if (config.debug) {
    log.setDebug(true)
  }
}
```

---

## Log Handler (`cli/log-handler.ts`)

Main thread listens and prints:

```ts
// cli/log-handler.ts
import pc from 'picocolors'
import { on } from './event-bus'

export function initLogHandler() {
  // Handle info logs
  on('log:info', ({ args }) => {
    console.log(...args)
  })

  // Handle error logs
  on('log:error', ({ args }) => {
    console.error(pc.red('error'), ...args)
  })

  // Handle debug logs
  on('log:debug', ({ args }) => {
    console.log(pc.dim('debug'), ...args)
  })
}
```

---

## Usage

### In Main Thread

```ts
// cli/sync/index.ts
import { log } from '../log'
import { initLogHandler } from '../log-handler'

export async function syncCommand(cwd, options) {
  // Setup log handler FIRST
  initLogHandler()

  const config = await loadUserConfig(cwd)
  initLog(config)

  log.debug('Starting sync...')
  // ... rest of sync
}
```

### In Worker Thread

```ts
// cli/virtual/init.ts (runVirtual - runs in worker)
import { log } from '../log'

export async function runVirtual(payload) {
  log.debug('[virtual:worker] Starting copy...')

  for (const file of files) {
    await copyFile(file)
  }

  log.debug('[virtual:worker] Copy complete')
}
```

Same API. Different execution path:

- **Main thread**: `log.debug()` → `emit('log:debug')` → handler prints
- **Worker thread**: `log.debug()` → `emit('log:debug')` → sent to main → handler prints

---

## Benefits

✅ **No console races** - All output goes through main thread  
✅ **Same API everywhere** - Workers and main use `log.debug()`  
✅ **Easy to extend** - Add log levels, formatting, transports  
✅ **Testable** - Mock event bus, verify log events  
✅ **Filterable** - Handler can ignore certain logs

---

## Advanced: Structured Logging

Add context to logs:

```ts
// Enhanced log payload
interface LogPayload {
  level: LogLevel
  context: string // e.g., 'virtual:worker', 'panda:main'
  message: string
  args: unknown[]
  timestamp: number
}

// Usage
log.debug('[virtual:worker]', 'Processing files...', { count: 10 })
```

Handler can format nicely:

```ts
on('log:debug', ({ context, args, timestamp }) => {
  const time = new Date(timestamp).toISOString()
  console.log(pc.dim(`${time} [${context}]`), ...args)
})
```

Output:

```
2026-02-21T13:45:23.123Z [virtual:worker] Processing files... { count: 10 }
```

---

## Advanced: Log Levels

Add more granularity:

```ts
export const log = {
  trace: (...args) => emit('log:trace', { level: 'trace', args }),
  debug: (...args) => emit('log:debug', { level: 'debug', args }),
  info: (...args) => emit('log:info', { level: 'info', args }),
  warn: (...args) => emit('log:warn', { level: 'warn', args }),
  error: (...args) => emit('log:error', { level: 'error', args }),
}

// Set min level
let minLevel: LogLevel = 'info'

export function setLogLevel(level: LogLevel) {
  minLevel = level
}
```

Handler respects level:

```ts
const LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 }

on('log:*', ({ level, args }) => {
  if (LEVELS[level] >= LEVELS[minLevel]) {
    console.log(...args)
  }
})
```

---

## Advanced: Multiple Transports

Send logs to different places:

```ts
export function initLogHandler(config) {
  const transports = []

  // Console transport (always)
  transports.push({
    handle: ({ level, args }) => console[level](...args),
  })

  // File transport (optional)
  if (config.logFile) {
    const stream = fs.createWriteStream(config.logFile)
    transports.push({
      handle: ({ level, args }) => {
        stream.write(`[${level}] ${args.join(' ')}\n`)
      },
    })
  }

  // Remote transport (optional)
  if (config.logEndpoint) {
    transports.push({
      handle: async payload => {
        await fetch(config.logEndpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      },
    })
  }

  // Wire up event handlers
  on('log:*', payload => {
    transports.forEach(t => t.handle(payload))
  })
}
```

---

## Testing

Mock the event bus:

```ts
import { emit } from '../event-bus'
import { log } from '../log'

vi.mock('../event-bus', () => ({
  emit: vi.fn(),
}))

test('logs debug message', () => {
  log.setDebug(true)
  log.debug('test message')

  expect(emit).toHaveBeenCalledWith('log:debug', {
    level: 'debug',
    args: ['test message'],
  })
})
```

Or test handler:

```ts
import { initLogHandler } from '../log-handler'
import { emit } from '../event-bus'

test('handler prints debug logs', () => {
  const spy = vi.spyOn(console, 'log')
  initLogHandler()

  emit('log:debug', { args: ['test'] })

  expect(spy).toHaveBeenCalledWith(expect.any(String), 'test')
})
```

---

## Performance

Events are cheap. For high-volume logs, batch them:

```ts
// In worker
const logQueue = []

function queueLog(level, args) {
  logQueue.push({ level, args, timestamp: Date.now() })

  // Flush every 100ms
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      emit('log:batch', { logs: logQueue.splice(0) })
      flushTimer = null
    }, 100)
  }
}

// In main thread handler
on('log:batch', ({ logs }) => {
  logs.forEach(({ level, args }) => {
    console[level](...args)
  })
})
```

But start simple. Optimize if needed.

---

## Migration Path

**Phase 1**: Current state - direct console.log

```ts
console.log('[virtual:worker]', 'message')
```

**Phase 2**: Add event bus, keep console.log temporarily

```ts
import { emit } from '../event-bus'

function log(...args) {
  console.log(...args) // Still works
  emit('log:info', { args }) // New path
}
```

**Phase 3**: Remove console.log, use events only

```ts
import { log } from '../log'

log.debug('[virtual:worker]', 'message')
```

**Phase 4**: Add structured logging, transports, etc.

---

## Why Events?

Could we just pipe worker stdout? Yes, but:

- **Less control** - Can't filter, format, route logs
- **Hard to test** - Mocking stdout is painful
- **Not extensible** - Adding transports is messy

Events give you:

- **Full control** - Format, filter, route as needed
- **Easy testing** - Mock event bus, verify calls
- **Extensible** - Add transports, levels, batching

And it fits naturally with the event bus architecture.

---

## Future Ideas

- **Log replay** for debugging
- **Log filtering** by module
- **Log aggregation** across multiple processes
- **Structured logs** (JSON output for parsing)

Start simple. Add features when needed.
