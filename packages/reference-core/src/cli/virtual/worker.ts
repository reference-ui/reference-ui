import { on } from '../event-bus'
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
    return new Promise(() => {})
  }
}

export type { VirtualWorkerPayload } from './run'
export default runVirtual
