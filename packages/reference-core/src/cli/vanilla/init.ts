/**
 * Initialize the Vanilla Extract benchmark module.
 * Runs a one-off VE build and reports memory consumption.
 */

import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'
import type { InitVanillaOptions } from './types'

/**
 * Run Vanilla Extract benchmark in a worker thread.
 * Sets up a minimal VE project, spawns the build as a child process,
 * and logs peak memory consumption.
 */
export function initVanilla(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitVanillaOptions
): void {
  log.debug('vanilla', 'initVanilla called')

  runWorker('vanilla', {
    cwd,
    config,
    benchDir: options?.benchDir ?? '.ref/vanilla-bench',
  })
    .then(() => {
      log.debug('vanilla', 'Benchmark complete')
    })
    .catch(error => {
      log.error('[vanilla] Benchmark failed:', error)
    })
}
