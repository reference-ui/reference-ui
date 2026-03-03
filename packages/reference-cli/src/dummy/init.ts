import { syncWorkers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start the dummy worker. Listens for sync:changed, emits sync:complete after delay.
 * Cold-mode trigger is emitted by sync/events.ts.
 */
export function initDummyWorker(_payload: SyncPayload): void {
  syncWorkers
    .runWorker('dummy', undefined)
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[dummy] Worker failed:', error)
    })
}
