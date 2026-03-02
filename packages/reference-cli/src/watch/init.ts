/**
 * Initialize watch system
 * Starts a worker thread that monitors file changes and triggers rebuilds
 */

import { log } from '../lib/log'
import { syncWorkers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start file watching in a worker thread when options.watch is true.
 */
export function initWatch(payload: SyncPayload): void {
  if (!payload.options.watch) return

  log.debug('watch', 'Starting watch worker')
  syncWorkers.runWorker('watch', { sourceDir: payload.cwd, config: payload.config }).catch(
    (error: unknown) => {
      log.error('[watch] Watch worker failed:', error)
    }
  )
}
