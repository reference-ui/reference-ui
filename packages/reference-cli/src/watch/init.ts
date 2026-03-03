import { log } from '../lib/log'
import { workers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start file watching in a worker thread when options.watch is true.
 */
export function initWatch(payload: SyncPayload): void {
  if (!payload.options.watch) return
  workers.runWorker('watch', {
    sourceDir: payload.cwd,
    config: payload.config,
  })
}
