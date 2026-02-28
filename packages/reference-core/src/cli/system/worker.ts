import { on } from '../event-bus'
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
    return new Promise(() => {})
  }
}

export type { SystemWorkerPayload }
export default runSystem
