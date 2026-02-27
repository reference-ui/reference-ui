import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'
import type { InitVirtualOptions } from './types'

/**
 * Initialize the virtual filesystem.
 * Performs a one-time copy of files to the virtual directory.
 * In watch mode, subscribes to watch:change and emits virtual:fs:change on each update.
 * @returns Promise that resolves when the initial copy completes (in non-watch) or when worker is ready.
 */
export function initVirtual(
  sourceDir: string,
  config: ReferenceUIConfig,
  options?: InitVirtualOptions
): Promise<void> {
  log.debug('virtual', 'initVirtual called')

  return runWorker('virtual', {
    sourceDir,
    config,
    virtualDir: config.virtualDir,
    watchMode: options?.watch ?? false,
  })
    .then(() => {
      log.debug('virtual', 'Initial copy complete')
    })
    .catch(error => {
      log.error('[virtual] Initialization failed:', error)
      throw error
    }) as Promise<void>
}
