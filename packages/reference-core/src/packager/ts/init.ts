import { on } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { destroyDedicatedPool, workers } from '../../lib/thread-pool'
import { PACKAGES } from '../packages'
import type { SyncPayload } from '../../sync/types'
import type { TsPackagerWorkerPayload } from './types'
import {
  initPackagerTsOrchestrator,
  markPackagerTsWorkerDisposed,
} from './orchestrator'

export { initPackagerTsOrchestrator } from './orchestrator'

const PACKAGER_TS_POOL = 'packager-ts'

let recycleHookRegistered = false
/** Serialize pool recycle so overlapping `packager-ts:complete` cannot double-destroy. */
let recycleChain: Promise<void> = Promise.resolve()

function startPackagerTsWorker(workerPayload: TsPackagerWorkerPayload): void {
  workers.runWorker('packager-ts', workerPayload, { poolName: PACKAGER_TS_POOL })
}

/**
 * After final declarations, tear down the dedicated packager-ts pool so the worker
 * V8 isolate and tsdown/tsc caches are released; spawn a fresh worker for the next
 * watch iteration. Cold sync skips this to avoid extra process churn.
 */
function enqueueRecyclePackagerTsPool(
  workerPayload: TsPackagerWorkerPayload
): void {
  recycleChain = recycleChain.then(async () => {
    try {
      markPackagerTsWorkerDisposed()
      await destroyDedicatedPool(PACKAGER_TS_POOL)
      startPackagerTsWorker(workerPayload)
    } catch (err) {
      log.error('[packager-ts] Failed to recycle DTS worker pool', err)
    }
  })
}

/**
 * Initialize packager-ts from main thread.
 * Starts worker that listens for explicit DTS run requests, generates .d.ts,
 * and emits packager-ts completion events.
 */
export function initTsPackager(payload: SyncPayload): void {
  if (payload.config.skipTypescript) return

  const packages = PACKAGES.filter((p) => p.entry).map((p) => ({
    name: p.name,
    sourceEntry: p.entry!,
    outFile: (p.main || './index.js').replace('./', ''),
  }))

  if (packages.length === 0) return

  const workerPayload: TsPackagerWorkerPayload = {
    cwd: payload.cwd,
    config: payload.config,
    packages,
    watchMode: payload.options.watch ?? false,
  }

  initPackagerTsOrchestrator()

  if (workerPayload.watchMode && !recycleHookRegistered) {
    recycleHookRegistered = true
    on('packager-ts:complete', () => {
      enqueueRecyclePackagerTsPool(workerPayload)
    })
  }

  startPackagerTsWorker(workerPayload)
}
