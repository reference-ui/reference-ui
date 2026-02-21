# Thread Pool Architecture

Date: February 21, 2026  
Status: Proposed

## Philosophy

**Each module owns its workers. No central coordination.**

The thread pool is pure infrastructure—it knows nothing about your tasks. Modules define their own tasks, evolve independently.

---

## Core API (`cli/thread-pool.ts`)

Dead simple. ~30 lines. **One global pool.**

```ts
// cli/thread-pool.ts
import Piscina from 'piscina'
import { cpus } from 'os'

let pool: Piscina | undefined

function getPool() {
  if (pool) return pool

  pool = new Piscina({
    minThreads: 2,
    maxThreads: Math.max(4, cpus().length - 1),
    idleTimeout: 30000,
  })

  pool.on('error', err => console.error('[pool]', err))
  return pool
}

export async function runWorker(workerPath: string, payload: any) {
  return getPool().run(payload, { filename: workerPath })
}

export async function shutdown() {
  if (pool) {
    await pool.destroy()
    pool = undefined
  }
}
```

That's it. One pool, shared by everyone.

---

## Module Pattern

**Worker file = pure boilerplate. Logic stays in the module.**

```ts
// <module>/index.ts
import { runWorker } from '../thread-pool'
import { join } from 'path'

const WORKER = join(__dirname, 'worker.js')

export async function heavyCliFunction(config, options?) {
  // Just pass data to worker, get result back
  return runWorker(WORKER, { config, ...options })
}
```

```js
// <module>/worker.js (pure boilerplate - no logic!)
const { heavyEntry } = require('./heavy-entry')
module.exports = heavyEntry
```

```ts
// <module>/heavy-entry.ts (where the real work lives)
export async function heavyEntry(payload) {
  const { config, changedFiles } = payload

  // All your logic here - decisions, modes, whatever
  if (changedFiles?.length) {
    return await runIncremental(changedFiles, config)
  }

  return await runFull(config)
}
```

**Worker is just a registration point. Module owns all logic.**

---

## Benefits

✅ **One shared pool** - Efficient thread usage across all modules  
✅ **Worker = boilerplate only** - No logic, no switches, no decisions  
✅ **Logic stays in modules** - All complexity in normal module code  
✅ **Self-contained** - Module owns its worker and heavy-entry  
✅ **Automatic queueing** - Piscina handles task distribution  
✅ **Clean testing** - Test heavy-entry directly, mock runWorker

---

## Advanced: Custom Pool Config

Need more threads? Just modify the pool creation:

```ts
// thread-pool.ts
pool = new Piscina({
  minThreads: 4,
  maxThreads: cpus().length - 1, // Use all cores
  idleTimeout: 60000, // Keep workers alive longer
})
```

One setting, affects everyone. Simple.

---

## When NOT to Use Workers

Don't overcomplicate:

- **File I/O** - Already async, no benefit
- **Simple transforms** - Overhead > benefit
- **Rare operations** - Not worth it

Use workers for:

- **Heavy CPU work** - AST transforms, compilation
- **Parallel processing** - Many files at once
- **Long-running tasks** - Codegen, bundling

---

## Testing

Test the heavy function directly (no workers needed):

```ts
import { heavyEntry } from '../<module>/heavy-entry'

test('runs full when no changed files', async () => {
  const result = await heavyEntry({
    config: mockConfig,
    changedFiles: undefined,
  })

  expect(result).toMatchSnapshot()
})

test('runs incremental on changed files', async () => {
  const result = await heavyEntry({
    config: mockConfig,
    changedFiles: ['src/App.tsx'],
  })

  expect(result.incremental).toBe(true)
})
```

Or mock `runWorker` for integration tests:

```ts
vi.mock('../thread-pool', () => ({
  runWorker: vi.fn(async (workerPath, payload) => mockResult),
}))
```

---

## File Structure

```
cli/
├── thread-pool.ts          # ~30 lines, ONE pool
├── <module>/
│   ├── index.ts            # Public API (heavyCliFunction)
│   ├── worker.js           # Boilerplate (3 lines)
│   ├── heavy-entry.ts      # Real logic
│   └── ...                 # Supporting code
```

Worker files are pure boilerplate. Logic lives in normal module code.

---

## Shutdown

Wire it up once:

```ts
// cli/sync/index.ts
import { shutdown } from '../thread-pool'

process.on('SIGINT', async () => {
  await shutdown()
  process.exit(0)
})
```

One pool closes, everyone's done.

---

## Why This Pattern Works

### Worker File Has Zero Logic

```js
// ❌ BAD - logic leaking into worker
module.exports = async ({ task, config, files }) => {
  if (task === 'full') return await runFull(config)
  if (task === 'incremental') return await runIncremental(files)
  // switches, modes, decisions...
}

// ✅ GOOD - pure boilerplate
const { heavyEntry } = require('./heavy-entry')
module.exports = heavyEntry
```

Worker is just a registration point. That's it.

### Module Owns Complexity

All decisions stay in normal module code:

```ts
// heavy-entry.ts - test this directly
export async function heavyEntry(payload) {
  // Your logic here
  // if/else, switch, modes, whatever
  // All testable without workers
}
```

### Caller Doesn't Care

```ts
// Just call the function, get result
await heavyCliFunction(config, { changedFiles: ['App.tsx'] })

// Module figures out what to do internally
// Caller doesn't know about implementation details
```

---

## Future Ideas

- **Shared memory** for large config objects
- **Worker reload** during watch mode
- **Performance metrics** per module
- **Automatic retries** for failed tasks

But start simple. Add complexity only when needed.
