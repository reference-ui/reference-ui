// Reference bridge run: it takes the phase payload plus an optional symbol name
// and emits the structured build result. Diagnostics warn, the built line
// infos, completion details debug; a throw becomes a failed result — never a
// rejection, so the background phase cannot take sync down with it.

import { createReferenceBuildReport, formatReferenceBuildDiagnostic } from './build-report.ts'
import type { ReferenceBuildComplete, ReferenceBuildResult } from './events.ts'
import {
  logReferenceBuilt,
  logReferenceCompleted,
  logReferenceError,
  logReferenceWarning,
} from './logging.ts'
import { rebuildReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

export interface ReferenceBuildPayload {
  name?: string
}

export async function onRunBuild(
  phasePayload: ReferenceTastyPayload,
  buildPayload: ReferenceBuildPayload
): Promise<ReferenceBuildResult> {
  const { name } = buildPayload
  const startedAt = Date.now()

  try {
    const state = await rebuildReferenceTastyBuild(phasePayload)
    const symbol = name ? await state.api.loadSymbolByName(name) : undefined
    const report = createReferenceBuildReport(state)

    for (const diagnostic of report.diagnostics) {
      logReferenceWarning(formatReferenceBuildDiagnostic(diagnostic))
    }

    logReferenceBuilt(Date.now() - startedAt)

    const completed: ReferenceBuildComplete = {
      name,
      symbolId: symbol?.getId(),
      source: 'project',
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      warningCount: report.warningCount,
      diagnosticCount: report.diagnosticCount,
      diagnostics: report.diagnostics,
    }
    logReferenceCompleted(completed)
    return { status: 'complete', ...completed }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logReferenceError(error)
    return { status: 'failed', name, message }
  }
}
