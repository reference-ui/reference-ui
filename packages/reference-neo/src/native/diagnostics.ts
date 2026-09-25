// Native diagnostic discipline: how the recipe answers the engine's report.
// It takes the result diagnostics and emits one warning line by default or
// the deduped verbose list, plus the error throw. Speaks only the diagnostic
// shape, so the next native consumer reuses it untouched.
import { dedupeDiagnostics, formatVerboseWarningLine, formatWarningSummary } from '../cli/output.ts'
import type { NativeDiagnostic } from './contract.ts'

function diagnosticLocation(entry: NativeDiagnostic): string {
  if (!entry.file) return ''
  if (entry.line === undefined) return ` (${entry.file})`
  if (entry.column === undefined) return ` (${entry.file}:${entry.line})`
  return ` (${entry.file}:${entry.line}:${entry.column})`
}

export function throwOnErrorDiagnostics(diagnostics: NativeDiagnostic[]): void {
  const errors = diagnostics.filter(entry => entry.severity === 'error')
  if (errors.length === 0) return
  const lines = errors.map(entry => `- ${entry.message}${diagnosticLocation(entry)}`)
  throw new Error(`native compile failed:\n${lines.join('\n')}`)
}

export interface DiagnosticReportOptions {
  verbose?: boolean
}

// Warnings print without throwing: a drifting sync that stays green must
// still show what the engine disliked, and a failing sync must not take
// its warnings down with the throw. One summary line by default; the
// deduped list with fix hints under --verbose. Silence when zero.
export function reportWarningDiagnostics(
  diagnostics: NativeDiagnostic[],
  options: DiagnosticReportOptions = {}
): void {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  if (warnings.length === 0) return
  if (options.verbose === true) {
    const lines = dedupeDiagnostics(warnings).map(item => formatVerboseWarningLine(item, false))
    console.warn(lines.join('\n'))
  } else {
    console.warn(formatWarningSummary(warnings.length))
  }
}

// The compiler backchannel prints through the same shapes: the summary
// counts its entries, and verbose lists them behind the compiler tag so
// the two channels stay distinguishable in one deduped list.
export function reportCompilerDiagnostics(
  entries: NativeDiagnostic[] | undefined,
  options: DiagnosticReportOptions = {}
): void {
  if (!entries || entries.length === 0) return
  if (options.verbose === true) {
    const lines = dedupeDiagnostics(entries).map(item => formatVerboseWarningLine(item, true))
    console.warn(lines.join('\n'))
  } else {
    console.warn(formatWarningSummary(entries.length))
  }
}

// The sync report: userspace warnings plus the opt-in compiler backchannel
// collapse to at most ONE console.warn call per sync — the counted summary
// by default, the channel-tagged deduped lists under --verbose. The stable
// codes ride the verbose lines so censuses count by `rg -c`, not by prose.
export function reportSyncDiagnostics(
  diagnostics: NativeDiagnostic[],
  compilerEntries: NativeDiagnostic[] | undefined,
  options: DiagnosticReportOptions = {}
): void {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  const compiler = compilerEntries ?? []
  const total = warnings.length + compiler.length
  if (total === 0) return
  if (options.verbose === true) {
    const lines = [
      ...dedupeDiagnostics(warnings).map(item => formatVerboseWarningLine(item, false)),
      ...dedupeDiagnostics(compiler).map(item => formatVerboseWarningLine(item, true)),
    ]
    console.warn(lines.join('\n'))
  } else {
    console.warn(formatWarningSummary(total))
  }
}
