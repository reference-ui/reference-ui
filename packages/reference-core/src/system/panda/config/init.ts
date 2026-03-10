import { workers } from '../../../lib/thread-pool'

/**
 * Start the config worker. Listens for run:system:config, writes panda.config, emits system:config:complete.
 */
export function initConfig(): void {
  workers.runWorker('config', {})
}
