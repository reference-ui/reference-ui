# Event Bus Architecture

Date: February 21, 2026  
Status: Proposed

## Philosophy

**Modules talk via events, not function calls.**

Loose coupling. Easy to add listeners. Natural watch mode. Clean dependencies.

---

## Core API (`cli/event-bus.ts`)

Minimal wrapper over EventEmitter. ~30 lines.

```ts
// cli/event-bus.ts
import { EventEmitter } from 'events'

export const bus = new EventEmitter()

export function emit(event: string, payload?: any) {
  bus.emit(event, payload)
}

export function on(event: string, handler: (payload: any) => void | Promise<void>) {
  bus.on(event, handler)
}

export function once(event: string, handler: (payload: any) => void | Promise<void>) {
  bus.once(event, handler)
}

export function off(event: string, handler?: Function) {
  if (handler) {
    bus.off(event, handler)
  } else {
    bus.removeAllListeners(event)
  }
}

// Debug mode
if (process.env.DEBUG) {
  const emit = bus.emit.bind(bus)
  bus.emit = (event, ...args) => {
    console.debug(`[bus] ${event}`, args[0])
    return emit(event, ...args)
  }
}
```

That's it. Re-export EventEmitter with nice names.

---

## Module Pattern

Modules emit when done, listen for upstream events:

```ts
// <module>/index.ts
import { on, emit } from '../event-bus'

export function initModule(config) {
  // Listen for upstream events
  on('upstream:done', async data => {
    // Do work
    const result = await doWork(data)

    // Emit when done
    emit('module:done', result)
  })
}
```

---

## Real Examples

### Watcher Module

Emits file changes:

```ts
// watcher/index.ts
import { emit } from '../event-bus'
import chokidar from 'chokidar'

export function initWatcher(config, { watch }) {
  if (!watch) return

  const watcher = chokidar.watch(config.include)

  watcher.on('change', path => {
    emit('file:changed', { path })
  })
}
```

### Virtual Module

Listens for file changes, emits when ready:

```ts
// virtual/index.ts
import { on, emit } from '../event-bus'
import { createPool } from '../thread-pool'

const pool = createPool('virtual', '...')

export function initVirtual(cwd, config) {
  // Listen for file changes
  on('file:changed', async ({ path }) => {
    await pool.run({ task: 'transform', path })
    emit('virtual:transformed', { path })
  })

  // Initial sync
  ;(async () => {
    await pool.run({ task: 'sync', cwd, config })
    emit('virtual:ready')
  })()
}
```

### Panda Module

Waits for virtual, then runs codegen:

```ts
// panda/index.ts
import { on, emit } from '../event-bus'
import { createPool } from '../thread-pool'

const pool = createPool('panda', '...')

export function initPanda(config) {
  // Wait for virtual to be ready
  once('virtual:ready', async () => {
    await pool.run({ task: 'codegen', config })
    emit('panda:done')
  })

  // Handle file changes
  on('virtual:transformed', async ({ path }) => {
    await pool.run({ task: 'incremental', path })
    emit('panda:updated')
  })
}
```

### Bundler Module

Waits for panda, bundles everything:

```ts
// bundler/index.ts
import { on, emit } from '../event-bus'
import { createPool } from '../thread-pool'

const pool = createPool('bundler', '...')

export function initBundler(config) {
  once('panda:done', async () => {
    await pool.run({ task: 'bundle', config })
    emit('bundler:done')
  })

  // Rebundle on panda updates
  on('panda:updated', async () => {
    await pool.run({ task: 'bundle', config })
    emit('bundler:done')
  })
}
```

---

## Event Flow

### Initial Build

```
virtual:ready
  ↓
panda:done
  ↓
bundler:done
  ↓
✅ Complete
```

### Watch Mode

```
file:changed
  ↓
virtual:transformed
  ↓
panda:updated
  ↓
bundler:done
  ↓
✨ Hot reload
```

---

## Top-Level Integration

Clean sync command:

```ts
// cli/sync/index.ts
import { loadUserConfig } from '../config'
import { initWatcher } from '../watcher'
import { initVirtual } from '../virtual'
import { initPanda } from '../panda'
import { initBundler } from '../bundler'
import { once } from '../event-bus'

export async function syncCommand(cwd, { watch }) {
  const config = await loadUserConfig(cwd)

  // Just init modules - they wire themselves up
  initWatcher(config, { watch })
  initVirtual(cwd, config)
  initPanda(config)
  initBundler(config)

  // Wait for completion if not watching
  if (!watch) {
    return new Promise(resolve => {
      once('bundler:done', resolve)
    })
  }
}
```

5 init calls. That's it.

---

## Benefits

✅ **Zero coupling** - Modules don't import each other  
✅ **Easy to extend** - New module = add listeners  
✅ **Watch mode is natural** - Events keep flowing  
✅ **Debuggable** - `DEBUG=1` logs all events  
✅ **Testable** - Mock `emit()` and verify calls

---

## Conventions

### Event Names

Use `module:action` format:

```
file:changed
virtual:ready
virtual:transformed
panda:done
panda:updated
bundler:done
```

Namespacing prevents collisions.

### Payloads

Keep them simple, serializable:

```ts
emit('file:changed', { path: 'src/App.tsx' })
emit('panda:done', { files: [...], duration: 123 })
```

### Error Events

Optional, but helpful:

```ts
on('panda:error', err => {
  console.error('Panda failed:', err)
})
```

---

## Advanced: Typed Events

Want type safety? Add a registry:

```ts
// cli/events.ts
export type Events = {
  'file:changed': { path: string }
  'virtual:ready': void
  'panda:done': { duration: number }
  'bundler:done': void
}

// Make helpers generic
export function emit<K extends keyof Events>(event: K, payload: Events[K]) {
  bus.emit(event, payload)
}

export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void
) {
  bus.on(event, handler)
}
```

Now you get autocomplete and type checking:

```ts
emit('panda:done', { duration: 123 }) // ✅
emit('panda:done', { invalid: true }) // ❌ Type error
```

But start untyped. Add types later if needed.

---

## Testing

Mock it:

```ts
// In tests
const events = []
vi.mock('../event-bus', () => ({
  emit: (e, p) => events.push([e, p]),
  on: vi.fn(),
}))

// Assert events were emitted
expect(events).toContain(['panda:done', expect.anything()])
```

Or use real bus and listen:

```ts
import { on } from '../event-bus'

test('emits done event', async () => {
  const promise = new Promise(resolve => {
    on('panda:done', resolve)
  })

  await initPanda(config)
  await expect(promise).resolves.toBeDefined()
})
```

---

## When NOT to Use Events

Direct calls are fine for:

- **Synchronous operations** - No latency needed
- **Return values** - Need immediate result
- **Internal module calls** - Private functions

Use events for:

- **Cross-module coordination** - Loose coupling
- **Watch mode** - Continuous updates
- **Optional listeners** - Not everyone cares

---

## Cleanup

Rarely needed, but available:

```ts
import { off } from '../event-bus'

// Remove specific handler
off('file:changed', myHandler)

// Remove all handlers for event
off('file:changed')
```

---

## Alternative: mitt

Want zero Node.js deps? Use `mitt` instead of BroadcastChannel. Same API, smaller bundle.

---

## Future Ideas

- **Event replay** for debugging
- **Event priority** (process some events first)
- **Event batching** (debounce file:changed)
- **Event middleware** (logging, metrics, filtering)

Start simple. Add when needed.
