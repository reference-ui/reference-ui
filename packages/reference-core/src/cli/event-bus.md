# Event-Driven CLI Architecture (Design Note)

**Goal**: Move fully to event-driven architecture. The CLI should use events for coordination, not async/await mixed with events.

## Current State

- Event bus is used in conjunction with async/await (e.g. `await initPackager()`, `runWorker()` returning promises)
- Sync command contains logic (listeners, init ordering, process.exit)
- Completion is inferred from promise resolution or ad-hoc events like `sync:complete`

## Target State

1. **Fully event-driven** — no async/await for cross-module coordination. Modules emit when done; other modules react.
2. **Process lifecycle via events** — events like `process:complete` drive decisions (e.g. when to exit). The main process listens, doesn't orchestrate.
3. **Minimal sync command** — sync should only: init the bus, init modules, register exit handler. No control flow logic.
4. **Explicit completion gates** — each module emits a well-defined "I'm done" event. The completion module (see `event-bus/complete.ts`) defines which events must fire before `sync:complete` / `process:complete`.

## Event Util: `onceAll`

An event utility that runs in the main thread when **all** specified events have been triggered:

```ts
// Conceptual API
onceAll(['packager:complete', 'packager-ts:complete'], () => {
  emit('process:complete', {})
})
```

- Runs in main thread
- Executes callback once, when every event in the list has fired at least once
- Handles ordering (events can fire in any order)
- Could support conditional gates (e.g. `packager-ts:complete` only required when `!skipTypescript`)

This would replace the custom logic in `complete.ts` and provide a reusable primitive for other "wait for N things" scenarios.

## Module Responsibility

Each module:

- **Emits** when it completes a logical step (e.g. `packager:complete`, `packager-ts:complete`, `system:compiled`)
- **Listens** for upstream events it depends on
- **Does not** know about process exit or orchestration

The completion module (or `onceAll` util) aggregates these and emits `process:complete` / `sync:complete` when the pipeline is done.

## Current Progress

- `event-bus/complete.ts` — `initSyncComplete(config)` and `SYNC_COMPLETE_GATES` define which events must fire before `sync:complete`. First step toward explicit gates.
- `packager-ts:complete` — new event; packager-ts emits when dts generation is done (replaces ad-hoc `sync:complete` from packager-ts).

## Migration Path

1. Add `onceAll(events, callback)` to event-bus
2. Refactor `complete.ts` to use `onceAll`
3. Replace `sync:complete` with `process:complete` (or keep both; define semantics)
4. Strip sync command down to minimal init + `once('process:complete', () => process.exit(0))`
5. Remove remaining async/await coordination in favor of event listeners
