// Reference build report: it takes tasty warnings plus diagnostics and emits
// the counted report run.ts returns. Pure tally — no I/O, no seams. The
// typed tasty diagnostics map onto the diagnostic shape in the standalone
// diagnostics module, and this file delegates to that mapping so the tally
// and the translation never drift.

import type { BuiltTasty, TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'
import { fromTastyDiagnostic } from '../../diagnostics/index.ts'
import type { NativeDiagnostic } from '../../native/contract.ts'

export interface ReferenceBuildReport {
  warningCount: number
  diagnosticCount: number
  diagnostics: readonly TastyBuildDiagnostic[]
}

export function createReferenceBuildReport(input: {
  warnings: BuiltTasty['warnings']
  diagnostics: readonly TastyBuildDiagnostic[]
}): ReferenceBuildReport {
  return {
    warningCount: input.warnings.length,
    diagnosticCount: input.diagnostics.length,
    diagnostics: input.diagnostics,
  }
}

// Tasty diagnostics ride the typed shape: severity plus a stable `TST-*`
// code plus the message, with the source location when the failure has one.
// The mapping carries every field onto the native shape verbatim.
export function tastyDiagnosticToNative(diagnostic: TastyBuildDiagnostic): NativeDiagnostic {
  return fromTastyDiagnostic(diagnostic)
}
