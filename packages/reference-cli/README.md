# @reference-ui/cli

Reference UI CLI – design system build pipeline and tooling.

## Architecture

### Event-Driven Design

The CLI runs on an event architecture. Workers run in separate threads (via [Piscina](https://github.com/piscinajs/piscina)); they communicate via a shared **BroadcastChannel** so events cross thread boundaries. The main thread orchestrates flow by wiring events together in module init code.

**Core principle:** Workers listen for events and call functions. Business logic lives in separate modules; the worker file itself is thin glue – it connects events to handlers and passes data. No logic in the worker, only wiring.

### Event Registry

All event names and payload types are defined in a central registry:

- **Location:** [`src/events.ts`](./src/events.ts)
- **Structure:** A type union (`SyncEvents & WatchEvents` and any future module events)
- **Format:** `{ 'event:name': PayloadType }` – maps event names to their payload shapes

`src/events.ts` is the single source of truth. The event bus (`lib/event-bus`) imports this type for typed `emit`/`on`/`once`. Each domain (sync, watch, etc.) defines its own event slice and exports it; `events.ts` composes them.

```
src/events.ts          → Events = SyncEvents & WatchEvents & ...
src/sync/types.ts      → SyncEvents
src/watch/events.ts    → WatchEvents
lib/event-bus/         → import { Events } from '../../events' → typed API
```

### workers.json ↔ Thread Pool

**`workers.json`** is the manifest of worker modules:

```json
{
  "watch": "src/watch/worker.ts",
  "dummy": "src/dummy/worker.ts"
}
```

**How it ties into the thread pool:**

1. **Registry** ([`src/lib/thread-pool/registry.ts`](./src/lib/thread-pool/registry.ts)) imports `workers.json` and calls `createWorkerPool(manifest)`.
2. **createWorkerPool** ([`src/lib/thread-pool/create-pool.ts`](./src/lib/thread-pool/create-pool.ts)) uses **keys only** (e.g. `watch`, `dummy`). Values in the manifest are ignored at runtime – they exist for tsup.
3. The pool maps each key to an **absolute path**: `dist/cli/${name}/worker.mjs` (resolved from the CLI package dir).
4. **tsup** uses `workerEntries` from the registry to generate entry points: each `{name}/worker` entry compiles to `dist/cli/${name}/worker.mjs`.

So: **workers.json keys** → **pool WORKERS** → **runWorker(name, payload)** → **Piscina runs the compiled worker**.

### Flow Overview

1. **sync command** boots: load config, init event bus, build `SyncPayload`.
2. **sync/events.ts** wires cross-domain flow: `watch:change` → `sync:changed`, `sync:complete` → maybe `process.exit`.
3. **Module inits** (e.g. `initDummyWorker`) call `syncWorkers.runWorker('dummy', payload)`.
4. Worker runs in a Piscina thread, subscribes to events via `on(...)`, returns `KEEP_ALIVE` so the thread stays alive.
5. Events flow through BroadcastChannel; all threads see them. Workers react and emit new events as needed.

---

## Creating a Module (e.g. Dummy)

A module is a domain that plugs into the sync pipeline. To add one:

### 1. Add to workers.json

```json
{
  "dummy": "src/dummy/worker.ts"
}
```

### 2. Create the module layout

```
src/dummy/
  init.ts     – called from sync command; spawns the worker with payload
  worker.ts   – thin glue: on(event, handler), pass payload to logic, return KEEP_ALIVE
  logic.ts    – actual logic (optional but encouraged)
  types.ts    – if you need custom payload types
```

### 3. Worker: events → functions only

The worker should only:

- Subscribe to events with `on('event:name', handler)`
- Call into logic modules (e.g. `logic.ts`) with the payload or derived data
- Return `KEEP_ALIVE` so the thread stays alive for event-driven work

**Don’t** put business logic in the worker. Put it in `logic.ts` (or similar) and have the worker call it.

Example (`dummy/worker.ts`):

The worker is a flat list mapping `on(event, handler)`. Event orchestration lives in `sync/events.ts`; the worker only wires events to handlers from logic:

```ts
import { on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onSyncChanged } from './logic'

export default async function runDummy(): Promise<never> {
  on('sync:changed', onSyncChanged)
  return KEEP_ALIVE
}
```

### 4. Logic module (logic.ts)

Exports pure handler functions. No `on` here – the worker does the wiring:

```ts
import { emit } from '../lib/event-bus'

export function onSyncChanged(): void {
  setTimeout(() => emit('sync:complete'), 500)
}
```

### 5. Define events (if new)

Add your events to the registry. Per-module event types go in that module (e.g. `sync/types.ts`, `watch/events.ts`), then compose in `src/events.ts`.

### 6. Wire the init

In `sync/command.ts`, call your module’s init (e.g. `initDummyWorker(payload)`). Flow orchestration lives in `sync/events.ts`; the command just runs the inits.

---

## Summary

| Concept | Where |
|--------|-------|
| Event registry (types) | `src/events.ts` |
| Flow orchestration | `src/sync/events.ts` |
| Worker manifest | `workers.json` |
| Thread pool / run | `src/lib/thread-pool/` |
| Event bus (emit/on) | `src/lib/event-bus/` |
| Module pattern | `worker.ts` = wiring, `logic.ts` = behavior |
