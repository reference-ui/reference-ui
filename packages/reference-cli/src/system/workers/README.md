# System Workers

Worker threads for the system pipeline. Each worker is a flat `on()` list wired to event handlers — no internal orchestration logic. Coordination happens in `sync/events.ts`.

Workers are registered in `workers.json` at the package root and bundled by tsup.

---

## Threading Model

Workers run in Piscina thread pools. They communicate via `BroadcastChannel` — events emitted in one worker are received by all others and the main thread.

Each worker:
1. Subscribes to trigger events (`run:*`)
2. Does its work
3. Emits completion events (`system:*:complete`)
4. Returns `KEEP_ALIVE` to stay alive for subsequent triggers

---

## `config` worker

**Location:** `system/config/worker.ts`

Generates `panda.config.ts` from base config + fragments.

```
on('run:system:config')  →  write panda.config  →  emit('system:config:complete')
```

Payload: `{ cwd: string }` — project root for resolving outDir.

---

## `panda` worker

**Location:** `system/panda/worker.ts`

Runs Panda codegen and cssgen. Requires `panda.config.ts` to already exist.

```
on('run:panda:codegen')  →  panda codegen  →  emit('system:panda:codegen')
on('run:panda:css')      →  panda cssgen   →  emit('system:panda:css')
```

Fast path: `run:panda:css` for watch-mode file changes (CSS only, no codegen).

---

## Adding a Worker

1. Create `src/<domain>/worker.ts` exporting a default async function returning `KEEP_ALIVE`.
2. Add to `workers.json`: `"<name>": "src/<domain>/worker.ts"`.
3. Create `init.ts` calling `workers.runWorker('<name>', payload)`.
4. Wire events in `sync/events.ts`.

Workers should be single-purpose. If you need conditional logic about what runs next, put it in the sync event wiring, not the worker.
