# Event Flow Map

The CLI is fully event-driven. The sync command performs minimal init (fire-and-forget); the event bus drives all coordination. Workers run in separate threads and communicate via BroadcastChannel.

---

## Sync Command (Cold Start)

```
syncCommand
  ├─ payload = await bootstrap(cwd, options)   → { cwd, config, options }
  ├─ initEventBus()
  ├─ initLog(payload)
  ├─ initSyncComplete(payload)   → onceAll(gates, () => process.exit(0))   [no-op when watch]
  ├─ initWatch(payload)
  ├─ initVirtual(payload)
  ├─ initSystem(payload)
  ├─ initGen(payload)
  ├─ initTsPackager(payload)   → starts worker that listens for packager:complete
  └─ initPackager(payload)
```

All inits receive `SyncPayload` (cwd, config, options). Bootstrap loads config once; inits are fire-and-forget. The event bus drives the flow; `initSyncComplete` registers `onceAll(gates, process.exit)` so the process exits when all cold-sync gates have fired.

---

## Event Chain (Cold Start)

```mermaid
flowchart LR
    V[virtual] -->|virtual:complete| S[system]
    S -->|config:ready| G[gen]
    G -->|system:compiled| P[packager]
    P -->|packager:complete| PT[packager-ts]
    PT -->|packager-ts:complete| DONE[process.exit]
```

**Exit gates** (from `sync/complete.ts`):

- `skipTypescript: true` → wait for `packager:complete` only
- `skipTypescript: false` → wait for `packager:complete` and `packager-ts:complete`

---

## Event Listeners

| Module     | Listens                       | Emits                                      |
|-----------|-------------------------------|--------------------------------------------|
| virtual   | watch:change                  | virtual:complete, virtual:fs:change        |
| system    | virtual:fs:change, gen:ready  | config:ready, system:complete, system:config:complete |
| gen       | config:ready (watch), virtual:fs:change (watch) | gen:ready, gen:complete, system:compiled |
| packager  | panda:css:compiled, system:compiled (watch) | packager:complete                      |
| packager-ts | packager:complete            | packager-ts:complete                       |
| sync      | —                             | — (initSyncComplete uses onceAll → process.exit) |

**Init-order independence**: Packager-ts derives "did I miss packager:complete?" from the filesystem on startup. If bundle output exists, it runs catch-up. No coordination events needed.

---

## Module Triggers

| Module     | Cold start                           | Watch mode                          |
|-----------|--------------------------------------|-------------------------------------|
| virtual   | init (immediate copy)                | same + on watch:change               |
| system    | init (runConfig)                     | same + on virtual:fs:change, gen:ready |
| gen       | init (runCodegen)                    | on config:ready, virtual:fs:change   |
| packager  | init (runBundle once)                | on system:compiled, panda:css:compiled |
| packager-ts | init (registers packager:complete listener) | same (re-runs on each packager:complete) |
| sync exit | onceAll(gates) → process.exit(0)     | no-op (watch keeps process alive)    |

---

## Key Design Points

- **No cross-module awaits** — init functions start workers and return. Workers coordinate via events.
- **packager-ts is event-driven** — does not run explicitly; listens for `packager:complete`, runs d.ts generation, emits `packager-ts:complete`.
- **initSyncComplete** — in cold mode, registers `onceAll([packager:complete, packager-ts:complete?], () => process.exit(0))`. In watch mode, returns no-op.
- **BroadcastChannel** — events are visible across all threads (main + workers).
