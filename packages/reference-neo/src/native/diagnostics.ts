// Native diagnostic compat layer: it takes engine result diagnostics and
// emits the same CLI reports as before. The reporting implementation lives in
// the standalone diagnostics module; this file re-exports it so existing
// native consumers keep their import path. New consumers import the
// diagnostics module directly. Behavior is pinned by the sync diagnostics
// suite — change it only with the pins.
import {
  formatJsonDiagnostics,
  reportedSyncEntries,
  reportCompilerDiagnostics,
  reportRefDiagnostics,
  reportSyncDiagnostics,
  reportWarningDiagnostics,
  throwOnErrorDiagnostics,
} from '../diagnostics/index.ts'
import type { DiagnosticReportOptions } from '../diagnostics/index.ts'

export {
  formatJsonDiagnostics,
  reportedSyncEntries,
  reportCompilerDiagnostics,
  reportRefDiagnostics,
  reportSyncDiagnostics,
  reportWarningDiagnostics,
  throwOnErrorDiagnostics,
}
export type { DiagnosticReportOptions }
