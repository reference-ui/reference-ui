import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { copyReferenceBrowserToVirtual } from './copy-browser-virtual'
import { onRunBuild } from './run'
import type { ReferenceWorkerPayload } from './worker-types'

/**
 * Reference worker scaffold.
 * Keep worker.ts as simple event-to-function wiring.
 */
export default async function runReference(payload: ReferenceWorkerPayload): Promise<never> {
  on('run:reference:build', (buildPayload) => onRunBuild(payload, buildPayload))
  on('run:reference:component:copy', async ({ virtualDir }) => {
    try {
      const paths = await copyReferenceBrowserToVirtual(virtualDir)
      for (const path of paths) {
        emit('virtual:fs:change', { event: 'add', path })
      }
      emit('reference:component:copied', {})
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      emit('reference:component:copy-failed', { message })
    }
  })
  emit('reference:ready')

  return KEEP_ALIVE
}
