# Thread Pool Architecture

## The Core Confusion: One File ≠ One Thread

**Common misconception:** "If I use one worker file, everything runs on one thread"

**Reality:** The worker _file_ is just a blueprint. Piscina creates **multiple JavaScript isolates** (threads) that each _load_ that same file, but run independently in parallel.

---

## Visual Example

### Your CLI starts up:

```
Main Thread (CLI)
    ↓
  Creates Piscina Pool
    ↓
  Spawns 3 Worker Threads (minThreads: 3)
    ↓
┌─────────────────────────────────────────┐
│ Worker Thread #1                        │
│ Loads: thread-pool/worker.ts            │
│ Has access to: watch(), packager(),     │
│                system(), virtual(), etc. │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Worker Thread #2                        │
│ Loads: thread-pool/worker.ts (SAME FILE)│
│ Has access to: watch(), packager(),     │
│                system(), virtual(), etc. │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Worker Thread #3                        │
│ Loads: thread-pool/worker.ts (SAME FILE)│
│ Has access to: watch(), packager(),     │
│                system(), virtual(), etc. │
└─────────────────────────────────────────┘
```

---

## When You Call runWorker()

### ❌ WRONG - Sequential awaits (would hang):

```typescript
// Main thread - THIS BLOCKS FOREVER
await runWorker('watch', { cwd: '/project' })      // ← watch never returns
await runWorker('packager', ...)                   // ← never reached
await runWorker('system', ...)                     // ← never reached
```

### ✅ CORRECT - Fire-and-forget for long-running tasks:

```typescript
// Main thread - dispatch without blocking
runWorker('watch', { cwd: '/project' }) // runs in background
runWorker('virtual', { cwd: '/project' }) // runs in background
runWorker('system', { cwd: '/project' }) // runs in background

// Main thread continues immediately, workers coordinate via event bus
```

### ✅ CORRECT - Await short-lived tasks:

```typescript
// For one-time builds/type-checks that return results:
const buildResult = await runWorker('packager', {
  entry: 'src/index.ts',
  watch: false, // one-shot build
})

const typeCheck = await runWorker('packagerTs', {
  mode: 'check',
})
```

**What Piscina does:**

```
Main Thread
    │
    ├─ runWorker('watch', ...) [no await]
    │   └─> Piscina: "Find an available thread"
    │       └─> Dispatch to Worker Thread #1
    │           └─> Executes: watch() [runs forever, listens for events]
    │
    ├─ runWorker('virtual', ...) [no await]
    │   └─> Piscina: "Find an available thread"
    │       └─> Dispatch to Worker Thread #2
    │           └─> Executes: virtual() [runs forever, transforms files]
    │
    └─ runWorker('system', ...) [no await]
        └─> Piscina: "Find an available thread"
            └─> Dispatch to Worker Thread #3
                └─> Executes: system() [scans, compiles, listens]
```

**Result:** All three workers run **in parallel** on different threads, main thread stays responsive.

---

## Why This is Better Than Separate Worker Files

### ❌ Old Approach (separate files per worker type):

```typescript
// thread-pool/index.ts
export async function runWorker(worker: WorkerName, payload: any) {
  const workerPath = WORKERS[worker] // e.g. '../watch/worker.ts'
  return pool.run(payload, { filename: workerPath })
}
```

**Problem:**

```
Worker Thread #1: Loads watch/worker.ts
    └─> Can ONLY run watch tasks
    └─> If no watch tasks, sits idle

Worker Thread #2: Loads packager/worker.ts
    └─> Can ONLY run packager tasks
    └─> If no packager tasks, sits idle

Worker Thread #3: Loads system/worker.ts
    └─> Can ONLY run system tasks
```

**Scenario:** You have 5 different worker types (watch, virtual, system, packager, packager-ts) but only 3 threads.

- If all 5 need to run simultaneously → **deadlock** (2 tasks wait forever)
- If only `watch` is busy → threads #2 and #3 sit idle (wasted resources)

---

### ✅ New Approach (unified worker file):

```typescript
// thread-pool/worker.ts
export async function watch(payload) {
  /* ... */
}
export async function packager(payload) {
  /* ... */
}
export async function system(payload) {
  /* ... */
}
export async function virtual(payload) {
  /* ... */
}
export async function packagerTs(payload) {
  /* ... */
}

// thread-pool/index.ts
export async function runWorker(worker: WorkerName, payload: any) {
  return pool.run(payload, { name: worker }) // ← uses 'name', not 'filename'
}
```

**Benefit:**

```
Worker Thread #1: Loads worker.ts → can run ANY task
Worker Thread #2: Loads worker.ts → can run ANY task
Worker Thread #3: Loads worker.ts → can run ANY task
```

**Scenario:** 5 workers dispatched (mix of long-running and short-lived), you have 3 threads:

1. Thread #1 picks up `watch` (long-running, keeps thread busy)
2. Thread #2 picks up `packager` (if watch: false, finishes quickly)
3. Thread #3 picks up `system` (finishes quickly)
4. `virtual` and `packagerTs` wait in queue
5. Thread #2 finishes → picks up `virtual` from queue
6. Thread #3 finishes → picks up `packagerTs` from queue
7. Thread #1 stays occupied by `watch` indefinitely

**No deadlock. No wasted threads. Any thread can run any task type.**

---

## What the Pool Actually Does

The pool is **not about the worker file**—it's about managing **actual OS threads**.

### Without Piscina (imaginary code):

```typescript
// Everything runs sequentially on main thread - SLOW
function processFiles() {
  scanConfig() // blocks for 0.5s
  buildPackage() // blocks for 2s
  typeCheck() // blocks for 3s
  transformVirtual() // blocks for 1s
}
// Total time: 6.5 seconds
```

### With Piscina + short-lived tasks:

```typescript
// Dispatch short-lived tasks in parallel
const [scanResult, buildResult, typeResult] = await Promise.all([
  runWorker('system', { task: 'scan' }), // Thread #1: 0.5s
  runWorker('packager', { mode: 'build' }), // Thread #2: 2s
  runWorker('packagerTs', { mode: 'check' }), // Thread #3: 3s
])
// Total time: 3 seconds (longest task)
```

### With Piscina + long-running workers:

```typescript
// Your actual CLI pattern (sync command)
export const syncCommand = async (cwd: string, options: SyncOptions) => {
  const config = await loadUserConfig(cwd)

  // Fire all workers without await - they run forever
  runWorker('watch', { cwd, config }) // Thread #1: monitors files
  runWorker('virtual', { cwd, config }) // Thread #2: transforms on demand
  runWorker('system', { cwd, config }) // Thread #3: compiles configs

  // Main thread stays alive, workers communicate via event bus
  log.info('CLI ready - workers running in background')
}
```

**The pool gives you:**

1. **Parallelism** - Multiple threads running at once
2. **Queueing** - If 10 tasks arrive but you have 3 threads, 7 wait in line
3. **Dynamic scaling** - Grows from `minThreads` to `maxThreads` under load
4. **Thread reuse** - When a thread finishes one task, it picks up the next queued task
5. **Automatic cleanup** - Kills idle threads after `idleTimeout`
6. **Fire-and-forget** - Long-running workers keep threads occupied indefinitely

---

## Thread Lifecycle Example

```
Time: 0s
  Pool state: 1 thread (minThreads: 1)
  Queue: empty

Time: 0.1s
  runWorker('watch') called (long-running, no await)
  Pool: Thread #1 busy with watch (will run forever)
  Queue: empty

Time: 0.2s
  runWorker('packager') called (short task, awaited)
  Pool: Thread #1 occupied by watch
  Pool spawns Thread #2 → starts packager task
  Queue: empty

Time: 0.3s
  runWorker('system') called (short task, awaited)
  Pool: Threads #1, #2 busy
  Pool spawns Thread #3 (maxThreads: 3) → starts system task
  Queue: empty

Time: 0.4s
  runWorker('virtual') called
  Pool: All 3 threads busy
  Queue: [virtual] (waiting for free thread)

Time: 2.0s
  Thread #2 finishes packager → returns result
  Thread #2 picks up 'virtual' from queue
  Queue: empty

Time: 5.0s
  Threads #2 and #3 finish their tasks → idle
  Thread #1 still running watch (long-running worker)
  Pool state: 3 threads (1 busy, 2 idle)

Time: 35.0s (idleTimeout: 30s elapsed)
  Threads #2 and #3 terminated (idle too long)
  Thread #1 still running watch
  Pool state: 1 thread (watch keeps it alive)

Watch worker keeps its thread alive until:
  - User hits Ctrl+C
  - pool.destroy() called
  - Worker exits cleanly via signal
```

---

## Configuration Tradeoffs

### Current config:

```typescript
pool = new Piscina({
  minThreads: 3,
  maxThreads: 3,
  idleTimeout: 30000,
})
```

**Analysis:**

- **Pro:** Instant parallelism (3 threads ready immediately)
- **Con:** Wastes ~180–240 MB RAM when idle
- **Con:** On 1-core machines, causes context-switch thrashing
- **Con:** With 5 worker types + fixed 3 threads → potential deadlock if using separate files

### Recommended config:

```typescript
const numCpus = cpus().length

pool = new Piscina({
  filename: resolve(__dirname, './worker.ts'), // unified worker
  minThreads: 1, // start lean
  maxThreads: Math.max(2, Math.min(5, numCpus)), // scale with CPU
  idleTimeout: 30000,
})
```

**Analysis:**

- **Pro:** Starts fast (1 thread = ~60 MB)
- **Pro:** Scales up to 5 threads on powerful machines
- **Pro:** Scales down to 2 threads on weak machines (no thrashing)
- **Pro:** Any thread can run any task (no deadlock)
- **Con:** First few tasks might be slightly slower (pool needs to warm up)

---

## Real-World Scenarios

### Scenario 1: Developer running `sync --watch`

```typescript
// sync/index.ts actual implementation:
export const syncCommand = async (cwd: string, options: SyncOptions) => {
  const config = await loadUserConfig(cwd)
  initEventBus()
  initLog(config)

  // All workers dispatched immediately, no blocking:
  initWatch(cwd, config, options) // → runWorker('watch', ...) [no await]
  initVirtual(cwd, config, options) // → runWorker('virtual', ...) [no await]
  initPackager(cwd, config, opts) // → runWorker('packager', ...) [no await]
  initSystem(cwd, config, opts) // → runWorker('system', ...) [no await]
  initTsPackager(cwd, config) // → runWorker('packagerTs', ...) [no await]

  // Main thread stays alive, workers communicate via event bus
}
```

**What happens:**

1. Main thread calls all 5 `initXxx()` functions synchronously
2. Each calls `runWorker()` without await → returns immediately
3. Pool spawns threads 1–5 (or queues if > maxThreads)
4. All workers start in parallel:
   - **watch**: Monitors file system, emits `file:changed` events
   - **virtual**: Listens for transform requests, processes files
   - **packager**: Listens for build events, bundles code
   - **system**: Scans components, compiles Panda config
   - **packagerTs**: Listens for type-check requests
5. Workers communicate via event bus:
   ```
   watch detects change → emits 'file:changed'
                        → packager receives event → rebuilds
                        → emits 'build:complete'
                        → packagerTs receives event → type-checks
   ```
6. Threads stay alive indefinitely until user exits (Ctrl+C)
7. `shutdown()` called → `pool.destroy()` → graceful cleanup

**Result:** Responsive watch mode, all subsystems running concurrently, event-driven coordination.

---

### Scenario 2: CI running one-shot build

```typescript
// CI: single build, no watch - safe to await
export const buildCommand = async (cwd: string) => {
  const config = await loadUserConfig(cwd)

  // Parallel one-shot tasks (all return results):
  const [configResult, pkgResult, tsResult] = await Promise.all([
    runWorker('system', {
      task: 'generateConfig',
      watch: false, // important: one-shot mode
    }),
    runWorker('packager', {
      entry: 'src/index.ts',
      watch: false,
    }),
    runWorker('packagerTs', {
      emitDeclarations: true,
      watch: false,
    }),
  ])

  log.info('Build complete', { configResult, pkgResult, tsResult })
  await shutdown() // gracefully destroy pool
}
```

**What happens:**

1. Pool starts with 1 thread (minThreads)
2. Three `runWorker()` calls dispatched via `Promise.all`
3. Pool spawns threads as needed (up to maxThreads):
   - Thread #1: `system` task (0.5s)
   - Thread #2: `packager` task (2s)
   - Thread #3: `packagerTs` task (3s) — if maxThreads >= 3
4. All run in parallel
5. `Promise.all` waits for slowest (3s)
6. Results returned to main thread
7. `shutdown()` destroys pool cleanly
8. Process exits

**Result:** Fast parallel build (~3s instead of 5.5s sequential), minimal memory, clean exit.

---

## Key Takeaways

1. **One worker file ≠ one thread** - The file is loaded by multiple threads
2. **The pool creates threads** - Not the worker file
3. **Unified worker = flexibility** - Any thread can run any task type
4. **Separate files = deadlock risk** - Each file locks a thread to one task type
5. **minThreads/maxThreads control parallelism** - Not the number of worker files
6. **Scale with CPU cores** - Don't hardcode thread counts

### Critical: Long-running vs Short-lived Workers

**Long-running workers** (never return):

```typescript
// NO AWAIT - fire and forget
runWorker('watch', { cwd }) // monitors files forever
runWorker('virtual', { cwd }) // listens for transform events
```

- Occupy a thread indefinitely
- Communicate via event bus, not return values
- Require graceful shutdown via signals or `pool.destroy()`

**Short-lived workers** (return results):

```typescript
// SAFE TO AWAIT - completes and returns
const result = await runWorker('packager', {
  entry: 'src/index.ts',
  watch: false, // one-shot build
})
```

- Run once and exit
- Return values to caller
- Free up thread for next task

**Never mix them in Promise.all**:

```typescript
// ❌ WRONG - Promise.all hangs waiting for watch to finish (never happens)
await Promise.all([
  runWorker('watch', { cwd }), // never resolves!
  runWorker('packager', { entry }), // waits forever
])

// ✅ CORRECT - separate long-running from short-lived
runWorker('watch', { cwd }) // fire-and-forget
const result = await runWorker('packager', { entry }) // await completion
```

---

## Refactoring Plan

### ✅ Acceptance Criteria

**Critical: Public API must remain unchanged**

```typescript
// sync/index.ts - NO CHANGES REQUIRED
export const syncCommand = async (cwd: string, options: SyncOptions) => {
  const config = await loadUserConfig(cwd)
  initEventBus()
  initLog(config)
  initWatch(cwd, config, options)      // ← stays exactly as-is
  initVirtual(cwd, config, options)    // ← stays exactly as-is
  initPackager(cwd, config, { watch: options?.watch })
  initSystem(cwd, config, { watch: options?.watch })
  initTsPackager(cwd, config)
}

// watch/init.ts - NO CHANGES REQUIRED
export function initWatch(sourceDir, config, options) {
  if (!options.watch) return
  runWorker('watch', { sourceDir, config }).catch(...)
}
```

**These files should NOT change:**

- ✅ `sync/index.ts` - syncCommand signature and implementation
- ✅ `watch/init.ts` - initWatch() API
- ✅ `virtual/init.ts` - initVirtual() API
- ✅ `packager/index.ts` - initPackager() API
- ✅ `system/index.ts` - initSystem() API
- ✅ `packager-ts/index.ts` - initTsPackager() API

**Only these files need changes:**

- 🔧 `thread-pool/index.ts` - Update runWorker() implementation
- 🆕 `thread-pool/worker.ts` - Create unified worker file
- 🔧 `thread-pool/workers.ts` - Remove or keep as reference (optional)

---

### Implementation Steps

1. **Create unified `thread-pool/worker.ts`** with all task exports:

   ```typescript
   export async function watch(payload) {
     const { default: watchImpl } = await import('../watch/worker.js')
     return watchImpl(payload)
   }
   // ... repeat for virtual, system, packager, packagerTs
   ```

2. **Update `thread-pool/index.ts`**:
   - Change `filename: workerPath` to `filename: resolve(__dirname, './worker.js')`
   - Use `{ name: worker }` in `pool.run()`
   - Make `maxThreads` dynamic: `Math.max(2, Math.min(5, cpus().length))`

3. **Test acceptance criteria**:
   - Run existing `sync --watch` command - should work identically
   - No changes to CLI behavior or API surface
   - Verify no deadlocks on 1-core and 8-core machines

4. **Verify improvements**:
   - No deadlock with 5 worker types and 3 threads
   - Better thread utilization (any thread can run any task)
   - Memory usage scales with CPU cores

See [README.md](./README.md) for implementation details.
