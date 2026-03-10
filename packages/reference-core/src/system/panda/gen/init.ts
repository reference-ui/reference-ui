import { workers } from '../../../lib/thread-pool'

/**
 * Start the panda worker. Listens for run:panda:codegen and run:panda:css.
 */
export function initPanda(): void {
  workers.runWorker('panda', {})
}
