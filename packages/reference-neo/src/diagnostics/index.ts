// Barrel for the Neo-owned diagnostics module.
// It takes nothing and re-exports the typed vocabulary, the native code
// template, the warning hints, the pull/push transport, the warning
// presentation, the span resolver, and the reporters.
export {
  DiagnosticParseError,
  REGISTERED_NAMESPACES,
  TEMPLATE_NAMESPACE,
  codeNamespace,
  codeSeverityTag,
  isRegisteredNamespace,
  parseCode,
} from '@reference-ui/rust/diagnostics'
export type { DiagnosticCode } from '@reference-ui/rust/diagnostics'
export { warningHintFor } from './hints.ts'
export {
  dedupeDiagnostics,
  formatVerboseWarningLine,
  formatWarningSummary,
} from './format.ts'
export { formatJsonDiagnostics } from './json.ts'
export {
  reportedSyncEntries,
  reportCompilerDiagnostics,
  reportRefDiagnostics,
  reportSyncDiagnostics,
  reportWarningDiagnostics,
  throwOnErrorDiagnostics,
} from './report.ts'
export { ByteLineIndex, createSpanResolver, lineColForOffset } from './resolve.ts'
export type { ResolvedPosition, SpanDiagnosticView } from './resolve.ts'
export {
  encodeBatch,
  encodeDiagnostic,
  fromTastyDiagnostic,
  isTypedDiagnostic,
  parseTypedBatch,
  parseTypedDiagnostic,
  partitionTyped,
  pullSyncDiagnostics,
} from './transport.ts'
export type {
  CompileResultView,
  DeduplicatedDiagnostic,
  DiagnosticChannel,
  DiagnosticLabel,
  DiagnosticReportOptions,
  DiagnosticSpan,
  NeoDiagnostic,
  TastyDiagnosticView,
  TypedDiagnostic,
  TypedSeverity,
} from './types.ts'
