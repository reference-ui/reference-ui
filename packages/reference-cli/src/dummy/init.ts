import { syncWorkers } from '../lib/thread-pool'

/**
 * Start the dummy worker. Listens for sync:changed, emits sync:complete after delay.
 */
export function initDummyWorker(): void {
  syncWorkers.runWorker('dummy', {}).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('[dummy] Worker failed:', error)
  })
}
