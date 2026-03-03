# @reference-ui/cli

Reference UI CLI – design system build pipeline.

## Architecture

How to use the thread pool and event system to build effectively: workers run in separate threads ([Piscina](https://github.com/piscinajs/piscina)); they communicate via **BroadcastChannel**. The main thread wires flow; workers map events to handlers.

**Principle:** Logic in `logic.ts`; worker file is wiring only.

### Event registry

`src/events.ts` – type union of all events. Each domain defines its slice; the event bus imports for typed `emit`/`on`.

### workers.json ↔ Thread pool

Manifest keys map to `dist/cli/${name}/worker.mjs`. The registry imports it; tsup uses `workerEntries` for build. **Keys only** – values exist for tsup paths.

### Flow

1. Main thread bootstraps, wires flow in an events module.
2. Module inits spawn workers via `runWorker(name, payload)`.
3. Workers subscribe with `on(...)`, return `KEEP_ALIVE` to stay alive.
4. Events flow via BroadcastChannel; all threads react.

---

## Module pattern

**Worker** = flat `on(event, handler)` list. **Logic** = handler functions in one file. **Orchestration** = events module (routing, cold triggers, etc.).

**Layout:** `init.ts` (spawns worker), `worker.ts` (wiring only), `logic.ts` (handlers).

### Worker

Flat list only. No conditionals, no branching. Multiple handlers per event is fine.

```ts
import { on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onEventA, onEventB, onSyncChanged } from './logic'

export default async function runWorker(): Promise<never> {
  on('sync:changed', onSyncChanged)
  on('sync:changed', onEventA)
  on('sync:changed', onEventB)
  return KEEP_ALIVE
}
```

### Logic

Pure handler functions. They receive payloads; they emit events. No `on` here.

```ts
import { emit } from '../lib/event-bus'

export function onSyncChanged(): void {
  setTimeout(() => emit('sync:complete'), 500)
}

export function onEventA(_p: { event: string; path: string }): void {}
export function onEventB(_p: { event: string; path: string }): void {}
```

### Adding a module

1. Add to `workers.json`.
2. Create `worker.ts` (flat `on` list), `logic.ts` (handlers), `init.ts` (spawn).
3. Wire init in the command entry point.
4. Define new events in registry if needed.

See `src/dummy/` for a working example.
