# Watch

The `watch` module owns file-change detection for `ref sync --watch`.

Its responsibility is intentionally small: subscribe to filesystem changes,
filter them against the configured include globs, normalize event names, and
emit `watch:change` onto the event bus.

It does not copy files, run Panda, or rebuild packages itself.

## What It Does

When watch mode is enabled, the watch worker:

- subscribes to the project source directory with `@parcel/watcher`
- filters changed paths against `ui.config.include`
- ignores `node_modules` at the watcher level
- maps raw watcher events into the sync event contract
- emits normalized `watch:change` payloads

## Why It Exists

The sync pipeline needs a stable, tool-agnostic event shape for downstream
incremental work.

The watch module provides that contract:

- raw watcher events are noisy and backend-specific
- sync wants a simple `add` / `change` / `unlink` model
- downstream workers should react to one event shape, not to parcel-specific
  details

## Current Role In The Pipeline

`watch` only runs when `ref sync --watch` is used.

Startup flow:

1. `sync/command.ts` calls `initWatch(payload)` when `options.watch` is true
2. `initWatch()` starts the watch worker
3. the worker subscribes to the project directory and stays alive
4. when matching files change, it emits `watch:change`

Current downstream wiring:

- `watch:change` is routed to `run:virtual:sync:file`

Important nuance:

- the current default watch flow updates the virtual mirror directly
- there is not currently a separate watch-driven Panda CSS fast path wired from
  `watch:change`

## Event Mapping

The worker maps parcel watcher events like this:

- `create` -> `add`
- `update` -> `change`
- `delete` -> `unlink`

The emitted payload shape is:

```ts
{
  event: 'add' | 'change' | 'unlink',
  path: '/absolute/path/to/file'
}
```

The `path` stays absolute. Downstream consumers convert or resolve it as needed.

## Filtering Behavior

The watch worker uses two filtering layers:

1. watcher-level ignore:
   - `**/node_modules/**`
   - `**/.reference-ui/**`
   - `**/.git/**`
   - positive patterns discovered from ancestor `.gitignore` files up to the repo root
2. include matching:
   - `picomatch(config.include)` against the path relative to `sourceDir`

Practical result:

- files outside `ui.config.include` do not emit `watch:change`
- `node_modules`, `.reference-ui`, `.git`, and other gitignored paths are ignored before include matching

## Implementation Shape

The module is intentionally tiny:

- `init.ts` decides whether watch mode should start the worker
- `worker.ts` owns the watcher subscription and event emission
- `events.ts` defines the event contract

That keeps the logic easy to reason about and pushes orchestration into the sync
event wiring instead of embedding it in the watcher.

## Confidence Today

Proven with direct unit tests and integration tests:

- `roots.test.ts`: cross-platform path resolution, Windows backslash glob normalization, and root collapsing
- `watcher.test.ts`: direct tests for `@parcel/watcher` state derivation, include filtering, teardown `unsubscribe()`, and dependency path resync detection
- `worker.test.ts`: error handler cooldowns, circuit breakers, and graceful OS buffer overflow handling
- `reference-unit`: verifies watch-mode edits update the virtual mirror
- `reference-e2e`: verifies a watch-mode edit propagates all the way to visible runtime styling in a sandboxed app

## Rules & Design Principles

### 1. Strictly No `node:fs` Watching
- **NEVER use `node:fs`** (e.g. `fs.watch`, `fs.watchFile`, `fs.promises.watch`) for watching files or directories.
- All file system monitoring in this module MUST strictly and exclusively use `@parcel/watcher`.
- `@parcel/watcher` provides native, performant, cross-platform file change events (FSEvents on macOS, inotify on Linux, etc.). Do not introduce ad-hoc Node.js file system watchers.

### 2. Anticipate OS Event Drops Gracefully
- Under heavy write activity (e.g. during compilation/sync), OS file system event queues like macOS FSEvents can drop buffer events.
- The watch worker anticipates this and handles it quietly in the background (logged at debug level). It does not spam the user console with warnings or trigger recursive, self-perpetuating full re-sync loops.

### 3. Keep the Implementation Clean and Minimal
- The watcher module's responsibility is small: subscribe to filesystem changes with `@parcel/watcher`, filter against include/dependency paths, and emit normalized events onto the event bus.
- Do not introduce complex nested fallbacks or secondary watcher subsystems.
- Watch normalizes events; it does not orchestrate rebuilds. The event contract stays small and boring.

