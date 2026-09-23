// Reference build report: it takes tasty warnings plus diagnostics and emits
// the counted report run.ts logs and returns. Pure tally — no I/O, no seams.

import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

export interface ReferenceBuildReport {
  warningCount: number
  diagnosticCount: number
  diagnostics: readonly TastyBuildDiagnostic[]
}

export function createReferenceBuildReport(input: {
  warnings: readonly string[]
  diagnostics: readonly TastyBuildDiagnostic[]
}): ReferenceBuildReport {
  return {
    warningCount: input.warnings.length,
    diagnosticCount: input.diagnostics.length,
    diagnostics: input.diagnostics,
  }
}

export function formatReferenceBuildDiagnostic(diagnostic: TastyBuildDiagnostic): string {
  const location = diagnostic.fileId ? `${diagnostic.fileId}: ` : ''
  return `${location}${diagnostic.message}`
}
