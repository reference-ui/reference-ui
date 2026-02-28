import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runConfig, onVirtualFsChange, onGenReady } from './run'
import type { SystemWorkerPayload } from './run'

/**
 * System worker - eval + config generation only.
 * Panda runs in the gen worker (separate thread).
 */
export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { watchMode = false } = payload
  const state = { configWritten: false }

  await runConfig(payload, state)

  if (watchMode) {
    on('virtual:fs:change', onVirtualFsChange(payload, state))
    on('gen:ready', onGenReady(state))
    return KEEP_ALIVE
  }
}

export type { SystemWorkerPayload }
export default runSystem
