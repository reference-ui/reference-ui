// Reference build report: it takes tasty warnings plus diagnostics and emits
// the counted report run.ts returns. Pure tally — no I/O, no seams. The
// unified reporter speaks only the diagnostic shape, so the mapping below
// translates tasty engine strings (codeless, file-only at most) onto it;
// the structured report above stays untouched.

import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'
import type { NativeDiagnostic } from '../../native/contract.ts'

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

// Tasty diagnostics predate the coded diagnostic shape: scanner items carry
// a file id but no line or code, manifest items (duplicate-symbol) are bare
// engine strings. The mapping keeps the message verbatim and the file when
// present, inventing nothing — no code, no line, no hint.
export function tastyDiagnosticToNative(diagnostic: TastyBuildDiagnostic): NativeDiagnostic {
  const entry: NativeDiagnostic = { severity: 'warning', message: diagnostic.message }
  if (diagnostic.fileId !== undefined) entry.file = diagnostic.fileId
  return entry
}
