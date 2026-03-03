import { workers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start the virtual worker. Copies files matching config.include to .reference-ui/virtual.
 * Listens for sync:changed and performs full copy on each event.
 */
export function initVirtual(payload: SyncPayload): void {
  workers.runWorker('virtual', {
    sourceDir: payload.cwd,
    config: payload.config,
  })
}
