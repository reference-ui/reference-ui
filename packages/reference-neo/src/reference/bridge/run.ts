// Reference bridge run: it takes the phase payload plus the build options
// and emits the structured build result. Tasty warnings ride the unified
// ref reporter (the verbose list under --verbose, the folded count under
// fold, the standalone summary for background landings, the JSON array
// under json); a throw becomes a failed result — never a rejection, so the
// background phase cannot take sync down with it. Success is silent — only
// failures log.

import { reportRefDiagnostics } from '../../native/diagnostics.ts'
import { createReferenceBuildReport, tastyDiagnosticToNative } from './build-report.ts'
import type { ReferenceBuildComplete, ReferenceBuildResult } from './events.ts'
import { logReferenceError } from './logging.ts'
import { rebuildReferenceTastyBuild } from './tasty-build.ts'
import type { ReferenceTastyPayload } from './types.ts'

export interface ReferenceBuildPayload {
  name?: string
  /**
   * List every tasty warning with its location instead of the folded
   * count. Threaded from `ref sync --verbose` through sync.
   */
  verbose?: boolean
  /**
   * Fold the warning count into the caller's one-liner instead of
   * printing the summary. Threaded from one-shot sync only; background
   * landings leave it unset and keep their standalone line.
   */
  fold?: boolean
  /**
   * Print the canonical diagnostics JSON array on stdout and stay silent
   * on stderr. Threaded from `ref sync --json` through sync for the
   * background landing; the one-shot path prints the array itself from
   * the drained result, so the flag only matters when nobody drains.
   */
  json?: boolean
}

export async function onRunBuild(
  phasePayload: ReferenceTastyPayload,
  buildPayload: ReferenceBuildPayload
): Promise<ReferenceBuildResult> {
  const { name } = buildPayload

  try {
    const state = await rebuildReferenceTastyBuild(phasePayload)
    const symbol = name ? await state.api.loadSymbolByName(name) : undefined
    const report = createReferenceBuildReport(state)

    if (buildPayload.json === true && buildPayload.fold !== true) {
      // The background landing owns its stdout line: the ref array, one
      // line, like every sync event in a --json session. Zero stays silent
      // everywhere, exactly like the human summary. Folded builds print
      // nothing here — the draining caller owns the combined array.
      const { formatJsonDiagnostics } = await import('../../diagnostics/index.ts')
      const entries = report.diagnostics.map(tastyDiagnosticToNative)
      if (entries.length > 0) {
        console.log(formatJsonDiagnostics(entries))
      }
    }

    const reportedWarningCount = reportRefDiagnostics(
      report.diagnostics.map(tastyDiagnosticToNative),
      { verbose: buildPayload.verbose === true, fold: buildPayload.fold === true }
    )

    const completed: ReferenceBuildComplete = {
      name,
      symbolId: symbol?.getId(),
      source: 'project',
      manifestPath: state.manifestPath,
      outputDir: state.outputDir,
      warningCount: report.warningCount,
      diagnosticCount: report.diagnosticCount,
      reportedWarningCount,
      diagnostics: report.diagnostics,
    }
    return { status: 'complete', ...completed }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logReferenceError(error)
    return { status: 'failed', name, message }
  }
}
