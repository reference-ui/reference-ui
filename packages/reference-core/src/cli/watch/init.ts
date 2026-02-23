/**
 * Initialize watch system
 * Starts a worker thread that monitors file changes and triggers rebuilds
 */

import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'

/**
 * Start file watching in a worker thread
 * Watches for file changes and automatically rebuilds when needed
 */
export function initWatch(sourceDir: string, config: ReferenceUIConfig): void {
  log.debug('[watch] Starting watch worker')

  runWorker('watch', {
    sourceDir,
    config,
  }).catch(error => {
    log.error('[watch] Watch worker failed:', error)
  })
}
