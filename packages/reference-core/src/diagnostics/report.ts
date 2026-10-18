// Neo diagnostic reporting: how a sync answers the engine's report.
// It takes result diagnostics and returns the reported count, printing
// the deduped verbose list only under --verbose. Default mode stays
// silent on stderr: the count folds into the CLI one-liner (sync line,
// resync line), so every rebuild reads as a single line. The ref
// backchannel keeps its standalone summary only for background landings
// that have no line to ride. Warnings never throw, so a drifting sync
// stays green and loud; errors throw with their codes and locations.
import { dedupeDiagnostics, formatVerboseWarningLine, formatWarningSummary } from './format.ts'
import type { DiagnosticReportOptions, NeoDiagnostic } from './types.ts'

function diagnosticLocation(entry: NeoDiagnostic): string {
  if (!entry.file) return ''
  if (entry.line === undefined) return ` (${entry.file})`
  if (entry.column === undefined) return ` (${entry.file}:${entry.line})`
  return ` (${entry.file}:${entry.line}:${entry.column})`
}

// The coded segment mirrors the verbose convention (`CODE: message`):
// legacy codeless entries print no segment, never `undefined:`.
function errorCodeSegment(entry: NeoDiagnostic): string {
  return entry.code === undefined ? '' : `${entry.code}: `
}

export function throwOnErrorDiagnostics(diagnostics: NeoDiagnostic[]): void {
  const errors = diagnostics.filter(entry => entry.severity === 'error')
  if (errors.length === 0) return
  const lines = errors.map(entry => `- ${errorCodeSegment(entry)}${entry.message}${diagnosticLocation(entry)}`)
  throw new Error(`native compile failed:\n${lines.join('\n')}`)
}

// Warnings report without throwing: a drifting sync that stays green must
// still count what the engine disliked, and a failing sync must not take
// its warnings down with the throw. The deduped list with fix hints prints
// under --verbose; by default the caller folds the returned count into its
// own one-liner. Zero returns zero and prints nothing anywhere.
export function reportWarningDiagnostics(
  diagnostics: NeoDiagnostic[],
  options: DiagnosticReportOptions = {}
): number {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  if (options.verbose === true && warnings.length > 0) {
    const lines = dedupeDiagnostics(warnings).map(item => formatVerboseWarningLine(item))
    console.warn(lines.join('\n'))
  }
  return warnings.length
}

// The compiler backchannel reports through the same shapes: the returned
// count folds into the caller's one-liner, and verbose lists entries
// behind the compiler tag so the two channels stay distinguishable in
// one deduped list. Zero returns zero and prints nothing anywhere.
export function reportCompilerDiagnostics(
  entries: NeoDiagnostic[] | undefined,
  options: DiagnosticReportOptions = {}
): number {
  const list = entries ?? []
  if (options.verbose === true && list.length > 0) {
    const lines = dedupeDiagnostics(list).map(item => formatVerboseWarningLine(item, 'compiler'))
    console.warn(lines.join('\n'))
  }
  return list.length
}

// The reference tasty backchannel reports through the same shapes: the
// returned count folds into the one-shot sync line when fold is set, and
// verbose lists entries behind the ref tag. Without fold the summary
// still prints by default — background landings have no sync line to
// ride, so silence there would lose the warnings. Entries arrive typed
// with stable codes and print with fix hints where known.
export function reportRefDiagnostics(
  entries: NeoDiagnostic[],
  options: DiagnosticReportOptions & { fold?: boolean } = {}
): number {
  if (options.verbose === true && entries.length > 0) {
    const lines = dedupeDiagnostics(entries).map(item => formatVerboseWarningLine(item, 'ref'))
    console.warn(lines.join('\n'))
  } else if (options.fold !== true && entries.length > 0) {
    console.warn(formatWarningSummary(entries.length))
  }
  return entries.length
}

// The reported set as data: userspace warnings plus every compiler entry in
// channel order, undeduped. The --json printers format this with
// formatJsonDiagnostics; it mirrors reportSyncDiagnostics exactly, minus the
// dedupe and the human lists. The one-shot caller appends the ref channel;
// background ref landings report their own array.
export function reportedSyncEntries(
  diagnostics: NeoDiagnostic[],
  compilerEntries: NeoDiagnostic[] | undefined,
): NeoDiagnostic[] {
  return [
    ...diagnostics.filter(entry => entry.severity === 'warning'),
    ...(compilerEntries ?? []),
  ]
}

// The sync report: userspace warnings plus the opt-in compiler backchannel
// collapse to one returned count — the channel-tagged deduped lists print
// under --verbose only. By default the caller folds the count into its own
// one-liner (the sync line, the resync line), so a sync prints nothing
// here. The stable codes ride the verbose lines so censuses count by
// `rg -c`, not by prose.
export function reportSyncDiagnostics(
  diagnostics: NeoDiagnostic[],
  compilerEntries: NeoDiagnostic[] | undefined,
  options: DiagnosticReportOptions = {}
): number {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  const compiler = compilerEntries ?? []
  const total = warnings.length + compiler.length
  if (options.verbose === true && total > 0) {
    const lines = [
      ...dedupeDiagnostics(warnings).map(item => formatVerboseWarningLine(item)),
      ...dedupeDiagnostics(compiler).map(item => formatVerboseWarningLine(item, 'compiler')),
    ]
    console.warn(lines.join('\n'))
  }
  return total
}
