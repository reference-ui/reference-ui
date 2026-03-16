import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { rebuildReferenceRuntime } from './runtime'
import type { ReferenceWorkerPayload } from './worker-types'

export interface ReferenceBuildPayload {
  name?: string
}

export async function onRunBuild(
  workerPayload: ReferenceWorkerPayload,
  buildPayload: ReferenceBuildPayload
): Promise<void> {
  const { name } = buildPayload

  try {
    const state = await rebuildReferenceRuntime(workerPayload)
    const symbol = name ? await state.api.loadSymbolByName(name) : undefined

    log.debug('reference', 'Reference build completed', {
      name,
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      virtualDir: state.virtualDir,
    })

    emit('reference:complete', {
      name,
      symbolId: symbol?.getId(),
      source: 'virtual',
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('[reference] Build failed:', error)
    emit('reference:failed', { name, message })
  }
}
