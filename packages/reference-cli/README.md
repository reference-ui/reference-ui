# @reference-ui/cli

Reference UI CLI – design system build pipeline.

## Commands

### ref sync (default)

Build and sync the design system. Uses workers and the event bus.

### ref clean

Removes the output directory (`.reference-ui` by default, or `config.outDir`). Runs in the main thread only. Use before tests for a fresh state.

## Architecture

Workers run in separate threads ([Piscina](https://github.com/piscinajs/piscina)); they communicate via **BroadcastChannel**. The main thread wires flow; workers map events to handlers.

**Principle:** Logic in handler functions; worker file is wiring only.

### Event registry

`src/events.ts` – type union of all events. Each domain defines its slice; the event bus imports for typed `emit`/`on`.

```ts
// events.ts
export type Events = SyncEvents & VirtualEvents & WatchEvents
```

### workers.json ↔ Thread pool

The pool exposes `workers` (registry of all possible workers). Manifest keys map to `dist/cli/${name}/worker.mjs`. `workerEntries` feeds tsup. **Keys only** – values exist for tsup paths.

### Flow

1. Main thread bootstraps, wires flow in an events module.
2. Module inits spawn workers via `workers.runWorker(name, payload)`.
3. Workers subscribe with `on(...)`, return `KEEP_ALIVE` to stay alive.
4. Events flow via BroadcastChannel; all threads react.

---

## Module pattern

**Worker** = flat `on(event, handler)` list. **Logic** = handler functions in one file. **Orchestration** = events module (routing, emit).

**Layout:** `init.ts` (spawns worker), `worker.ts` (wiring only), `events.ts` (module event types).

### Worker

Flat list only. No conditionals, no branching. Multiple handlers per event is fine.

```ts
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { runInitialCopy } from './initial-copy'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const handler = () => {
    runInitialCopy(payload).catch((err) => console.error('[virtual] Copy failed:', err))
  }

  on('run:virtual:copy', handler)
  emit('virtual:ready')

  return KEEP_ALIVE
}
```

### Logic

Pure handler functions. They receive payloads; they emit events. No `on` here.

```ts
import { emit } from '../lib/event-bus'

export async function runInitialCopy(payload: VirtualWorkerPayload): Promise<void> {
  // ... do work ...
  emit('virtual:complete')
}
```

### Event wiring (orchestration)

```ts
on('virtual:ready', () => emit('run:virtual:copy'))
on('watch:change', () => emit('run:virtual:copy'))
on('virtual:complete', () => emit('sync:complete'))
```

### Adding a module

1. Add to `workers.json`.
2. Create `worker.ts` (flat `on` list), logic file (handlers), `init.ts` (spawn).
3. Wire init in the command entry point.
4. Define new events in registry if needed.

See `src/virtual/` for a working example.
