import { syncWorkers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start the dummy worker. Listens for sync:changed, emits sync:complete after delay.
 * In cold mode, triggers immediately on startup (no main-thread emit).
 */
export function initDummyWorker(payload: SyncPayload): void {
  syncWorkers
    .runWorker('dummy', { triggerImmediately: !payload.options.watch })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[dummy] Worker failed:', error)
    })
}
