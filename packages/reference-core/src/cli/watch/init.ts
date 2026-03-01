/**
 * Initialize watch system
 * Starts a worker thread that monitors file changes and triggers rebuilds
 */

import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Start file watching in a worker thread when options.watch is true.
 */
export function initWatch(payload: SyncPayload): void {
  if (!payload.options.watch) return

  log.debug('watch', 'Starting watch worker')
  runWorker('watch', { sourceDir: payload.cwd, config: payload.config }).catch(
    error => {
      log.error('[watch] Watch worker failed:', error)
    }
  )
}
