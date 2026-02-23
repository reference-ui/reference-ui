/**
 * Initialize watch system
 * Starts a worker thread that monitors file changes
 */

import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'

/**
 * Start file watching in a worker thread
 * Emits 'watch:change' events that other modules can listen to
 */
export function initWatch(sourceDir: string, config: ReferenceUIConfig): void {
  const { include, debug = false } = config

  log.debug('[watch] Starting watch worker')

  runWorker('watch', {
    sourceDir,
    include,
    debug,
  }).catch(error => {
    log.error('[watch] Watch worker failed:', error)
  })
}
