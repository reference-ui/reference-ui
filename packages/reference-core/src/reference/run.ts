import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { rebuildReferenceTastyBuild } from './tasty-build'
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
    const state = await rebuildReferenceTastyBuild(workerPayload)
    const symbol = name ? await state.api.loadSymbolByName(name) : undefined

    for (const diagnostic of state.diagnostics) {
      const location = diagnostic.fileId ? `${diagnostic.fileId}: ` : ''
      log.info('[reference] warning:', `${location}${diagnostic.message}`)
    }

    log.debug('reference', 'Reference build completed', {
      name,
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      virtualDir: state.virtualDir,
      warningCount: state.warnings.length,
      diagnosticCount: state.diagnostics.length,
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
