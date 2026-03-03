# @reference-ui/cli

Reference UI CLI – design system build pipeline.

## Commands

### ref sync (default)

Build and sync the design system. Uses workers and the event bus.

### ref clean

Removes the output directory (`.reference-ui` by default, or `config.outDir`). Runs in the main thread only. Use before tests for a fresh state.

## Architecture

Workers run in separate threads ([Piscina](https://github.com/piscinajs/piscina)); they communicate via **BroadcastChannel**. The main thread wires flow; workers map events to handlers.

### Event registry

`src/events.ts` – type union of all events. Each domain defines its slice; the event bus imports for typed `emit`/`on`.

### Sync events

Sync has one event: `sync:complete`.

### Module events (e.g. virtual)

Modules like virtual define their own events: **run:** (command to run an action) and **notifications** (emitted when the module completes).

- `run:virtual:copy` – run the virtual copy
- `virtual:complete` – notification: copy is done

On `virtual:ready`, sync emits `run:virtual:copy`. On `watch:change`, sync also emits `run:virtual:copy`.

### workers.json ↔ Thread pool

The pool exposes `workers` (registry of all possible workers). Manifest keys map to `dist/cli/${name}/worker.mjs`. `workerEntries` feeds tsup. **Keys only** – values exist for tsup paths.

### Flow

1. Main thread bootstraps, wires flow in `sync/events.ts`.
2. Module inits spawn workers via `workers.runWorker(name, payload)`.
3. Workers subscribe with `on(...)`, return `KEEP_ALIVE` to stay alive.
4. Events flow via BroadcastChannel; all threads react.

---

## Module pattern

**Worker** = flat `on(event, handler)` list. **Logic** = handler functions in one file. **Orchestration** = events module (routing, triggers).

**Layout:** `init.ts` (spawns worker), `worker.ts` (wiring only), `events.ts` (module event types).

See `src/virtual/` for the implementation.
