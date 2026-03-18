import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunBuild } from './run'
import type { ReferenceWorkerPayload } from './worker-types'

/**
 * Reference worker scaffold.
 * Keep worker.ts as simple event-to-function wiring.
 */
export default async function runReference(payload: ReferenceWorkerPayload): Promise<never> {
  on('run:reference:build', (buildPayload) => onRunBuild(payload, buildPayload))
  emit('reference:ready')

  return KEEP_ALIVE
}
