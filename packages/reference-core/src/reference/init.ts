import { workers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start the reference worker.
 * It will eventually read from the virtual FS and build Tasty-backed docs output.
 */
export function initReference(payload: SyncPayload): void {
  workers.runWorker('reference', {
    sourceDir: payload.cwd,
    config: payload.config,
  })
}
