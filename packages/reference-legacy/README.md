# @reference-ui/legacy — FROZEN MUSEUM. READ THE LAW BEFORE SCROLLING.

This is `packages/reference-core` as it stood on `main`, preserved for
Operation Tokyo. It is the last known-working architecture. Everything
below the line is the original README, kept verbatim as museum content.

## The law (HQ 2026-09-23)

1. **Read-only.** Nobody edits this tree. The only intentional diff from
   `main` is `package.json` (renamed `@reference-ui/core` 0.0.43 →
   `@reference-ui/legacy`, marked private). Any other diff is a bug.
2. **Nothing imports it.** It is excluded from the pnpm workspace
   (`pnpm-workspace.yaml`), unresolvable by design. Neo's import
   boundary already bans core/lib paths; legacy is doubly banned —
   copy an idea out with attribution, never an import.
3. **Panda-isms stay.** Do not "clean" this tree. It is the before
   photo; filtering happens in Neo, by writing the after photo.
4. **Evidence, not gospel.** Tokyo's CORE-BONES catalogue cites
   file:line here for what to steal. What's heinous stays heinous —
   cite it as what-not-to-do or leave it alone.
5. **No tooling.** No installs, builds, tests, or typechecks run here.
   Its configs (eslint, project.json, tools/) are exhibits.

Provenance: `git archive main packages/reference-core`, committed as
the Tokyo reference. Verify stasis any time:
`git diff main -- packages/reference-legacy` must show only the
directory rename plus the package.json identity line.

---

Original README follows. Museum content — do not update.

# @reference-ui/core (as it was)

Reference UI CLI – design system build pipeline.

## Commands

### ref sync (default)

Build and sync the design system. Uses workers and the event bus.

### ref clean

Removes the output directory (`.reference-ui`). Runs in the main thread only. Use before tests for a fresh state.

### ref mcp

Runs the Reference UI MCP server.

- `ref mcp` starts the stdio server used by MCP clients such as VS Code.
- `ref mcp --transport http` starts the HTTP server for local inspection and debugging.

#### Standard VS Code setup

Prefer the published `npx` form for MCP clients:

```json
{
  "servers": {
    "referenceUi": {
      "type": "stdio",
      "command": "npx",
      "cwd": "${workspaceFolder}",
      "args": ["-y", "--package", "@reference-ui/core", "mcp"]
    }
  }
}
```

If your MCP client supports `cwd`, set it to the project whose `ui.config.ts`
should drive MCP output.

For repo-local development, the direct built CLI path is a deterministic
fallback:

```json
{
  "servers": {
    "referenceUi": {
      "type": "stdio",
      "command": "node",
      "cwd": "${workspaceFolder}/packages/reference-docs",
      "args": ["${workspaceFolder}/packages/reference-core/dist/cli/index.mjs", "mcp"]
    }
  }
}
```

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
import { copyAll } from './copy-all'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const handler = () => {
    copyAll(payload).catch(err => console.error('[virtual] Copy failed:', err))
  }

  on('run:virtual:copy:all', handler)
  emit('virtual:ready')

  return KEEP_ALIVE
}
```

### Logic

Pure handler functions. They receive payloads; they emit events. No `on` here.

```ts
import { emit } from '../lib/event-bus'

export async function copyAll(payload: VirtualWorkerPayload): Promise<void> {
  // ... do work ...
  emit('virtual:complete')
}
```

### Event wiring (orchestration)

```ts
on('virtual:ready', () => emit('run:virtual:copy:all'))
on('watch:change', () => emit('run:virtual:copy:all'))
on('virtual:complete', () => emit('sync:complete'))
```

### Adding a module

1. Add to `workers.json`.
2. Create `worker.ts` (flat `on` list), logic file (handlers), `init.ts` (spawn).
3. Wire init in the command entry point.
4. Define new events in registry if needed.

See `src/virtual/` for a working example.
