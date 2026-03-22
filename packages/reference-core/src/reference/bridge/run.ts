import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import {
  createReferenceBuildReport,
  formatReferenceBuildDiagnostic,
} from './build-report'
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
    const report = createReferenceBuildReport(state)

    for (const diagnostic of report.diagnostics) {
      log.info('[reference] warning:', formatReferenceBuildDiagnostic(diagnostic))
    }

    log.debug('reference', 'Reference build completed', {
      name,
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      virtualDir: state.virtualDir,
      warningCount: report.warningCount,
      diagnosticCount: report.diagnosticCount,
    })

    emit('reference:complete', {
      name,
      symbolId: symbol?.getId(),
      source: 'virtual',
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      warningCount: report.warningCount,
      diagnosticCount: report.diagnosticCount,
      diagnostics: report.diagnostics,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('[reference] Build failed:', error)
    emit('reference:failed', { name, message })
  }
}
