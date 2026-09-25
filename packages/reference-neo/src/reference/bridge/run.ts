// Reference bridge run: it takes the phase payload plus the build options
// and emits the structured build result. Tasty warnings ride the unified
// one-line reporter (the verbose list under --verbose); the built line infos;
// a throw becomes a failed result — never a rejection, so the background
// phase cannot take sync down with it.

import { reportRefDiagnostics } from '../../native/diagnostics.ts'
import { createReferenceBuildReport, tastyDiagnosticToNative } from './build-report.ts'
import type { ReferenceBuildComplete, ReferenceBuildResult } from './events.ts'
import { logReferenceBuilt, logReferenceError } from './logging.ts'
import { rebuildReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

export interface ReferenceBuildPayload {
  name?: string
  /**
   * List every tasty warning with its location instead of the one-line
   * summary. Threaded from `ref sync --verbose` through sync.
   */
  verbose?: boolean
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

    reportRefDiagnostics(
      report.diagnostics.map(tastyDiagnosticToNative),
      { verbose: buildPayload.verbose === true }
    )

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
    return { status: 'complete', ...completed }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logReferenceError(error)
    return { status: 'failed', name, message }
  }
}
