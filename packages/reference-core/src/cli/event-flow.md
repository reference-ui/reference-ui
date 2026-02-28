# Event Flow Map

Goal: Remove `await initTsPackager`, make the event bus the scheduler. Sync command should be minimal init + event listeners; no control flow logic.

---

## Current State (Cold Start)

```
syncCommand
  ├─ initVirtual()     → runWorker('virtual')     [NOT awaited - returns when copy done]
  ├─ initSystem()      → runWorker('system')      [AWAITED]
  ├─ initGen()         → runWorker('gen')         [AWAITED]
  ├─ initPackager()    → runWorker('packager')    [NOT awaited] ← initPackager awaits internally
  ├─ await initTsPackager() → runWorker('packager-ts')  [AWAITED]
  └─ process.exit(0)
```

**Dependency chain** (enforced by await order):

```mermaid
flowchart LR
    V[virtual] -->|virtual:complete| S[system]
    S -->|config:ready| G[gen]
    G -->|system:compiled| P[packager]
    P -->|packager:complete| PT[packager-ts]
    PT -->|packager-ts:complete| DONE
```

**Current event listeners:**
| Module | Listens | Emits |
|--------|---------|-------|
| virtual | watch:change | virtual:complete, virtual:fs:change |
| system | virtual:fs:change, gen:ready | config:ready, system:complete |
| gen | virtual:fs:change, config:ready | gen:ready, gen:complete, system:compiled |
| packager | panda:css:compiled, system:compiled | packager:complete |
| packager-ts | — | packager-ts:complete |

**Gap:** packager-ts doesn't listen for packager:complete — it's invoked explicitly. `initSyncComplete` exists but isn't wired up; nothing listens for sync:complete.

---

## Target State (Event-Driven Scheduler)

```
syncCommand
  ├─ initEventBus()
  ├─ initLog()
  ├─ initSyncComplete(config)   → onceAll([packager:complete, packager-ts:complete?], () => emit('sync:complete'))
  ├─ once('sync:complete', () => process.exit(0))   [only when !watch]
  ├─ initWatch()
  ├─ initVirtual()
  ├─ initSystem()
  ├─ initGen()
  ├─ initPackager()
  └─ initTsPackager()   → register listener, NOT run worker
```

All inits fire-and-forget. The event bus drives the flow.

---

## Event Chain (Target – Cold Start)

Same pipeline as above. Exit is event-driven: `initSyncComplete` waits for all gates, emits `sync:complete` → `process.exit(0)`.

---

## Required Changes

### 1. **packager** – trigger on system:compiled (cold start too)

Today packager runs `runBundle` immediately on start. For event-driven cold start, packager must wait for `system:compiled` before first bundle.

- Option A: packager always waits for `system:compiled`; gen emits it after first run
- Option B: keep packager’s immediate run, but ensure gen runs first (current behavior via await order)

Option A is cleaner: packager worker registers `once('system:compiled', runBundle)` for cold start; in watch mode it already uses `on('system:compiled', ...)`.

### 2. **packager-ts** – event-driven

Instead of `initTsPackager` calling `runWorker`:

- `initTsPackager(cwd, config)` registers: `once('packager:complete', () => runWorker('packager-ts', { cwd, config, packages }))`
- If `config.skipTypescript`, don’t register the listener

### 3. **initSyncComplete** – wire into sync

- Call `initSyncComplete(config)` in syncCommand
- Add `sync:complete` to `Events`
- Replace `if (!options?.watch) process.exit(0)` with `once('sync:complete', () => process.exit(0))` when `!options?.watch`

### 4. **gen** – cold start trigger

Gen currently runs `runCodegen` directly in cold start; it doesn’t wait for `config:ready`. System emits `config:ready` after runConfig.

For event-driven flow: gen should run on `config:ready` in both cold and watch. That implies system must finish before gen can run Panda (needs config). Today this is enforced by await order; with events, system runs first, emits `config:ready`, gen reacts.

### 5. **system** – cold start trigger

System runs on init. It may need `virtual:complete` first. If so, system would listen for `virtual:complete` and run when it fires. Otherwise it can keep running on init.

---

## Summary: What Stays vs Changes

| Module     | Current trigger             | Target trigger                          |
|-----------|-----------------------------|-----------------------------------------|
| virtual   | init (immediate)            | same                                    |
| system    | init (immediate)            | same (or virtual:complete)              |
| gen       | init (cold) / config:ready  | config:ready (both modes)               |
| packager  | init (immediate runBundle)  | system:compiled (both modes)            |
| packager-ts | init (explicit call)      | packager:complete (listener in init)    |
| sync exit | synchronous after awaits   | sync:complete (from initSyncComplete)   |
