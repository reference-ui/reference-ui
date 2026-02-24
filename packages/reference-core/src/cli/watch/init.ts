/**
 * Initialize watch system
 * Starts a worker thread that monitors file changes and triggers rebuilds
 */

import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'
import type { SyncOptions } from '../sync/types'

/**
 * Start file watching in a worker thread when options.watch is true.
 */
export function initWatch(sourceDir: string, config: ReferenceUIConfig, options: SyncOptions): void {
  if (!options.watch) return

  log.debug('[watch] Starting watch worker')
  runWorker('watch', { sourceDir, config }).catch(error => {
    log.error('[watch] Watch worker failed:', error)
  })
}
