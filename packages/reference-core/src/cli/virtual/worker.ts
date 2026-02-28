import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runInitialCopy, onWatchChange } from './run'
import type { VirtualWorkerPayload } from './run'

/**
 * Virtual worker - syncs source files to virtual dir.
 * Listens for watch:change in watch mode, emits virtual:fs:change.
 */
export async function runVirtual(payload: VirtualWorkerPayload): Promise<void> {
  const { watchMode = false } = payload

  const context = await runInitialCopy(payload)

  if (watchMode) {
    on('watch:change', onWatchChange(context))
    return KEEP_ALIVE
  }
}

export type { VirtualWorkerPayload } from './run'
export default runVirtual
