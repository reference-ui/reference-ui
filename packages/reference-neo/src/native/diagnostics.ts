// Native diagnostic discipline: how the recipe answers the engine's report.
// It takes the result diagnostics and emits loud warnings, the compiler
// backchannel, and the error throw. Speaks only the diagnostic shape, so the
// next native consumer reuses it untouched.

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

// Warnings print LOUD on every sync and never throw: a drifting sync that
// stays green must still show what the engine disliked, and a failing sync
// must not take its warnings down with the throw. The stable code rides the
// line so censuses count by `rg -c`, not by reading prose.
function diagnosticCodeSuffix(entry: NativeDiagnostic): string {
  return entry.code === undefined ? '' : ` ${entry.code}`
}

export function reportWarningDiagnostics(diagnostics: NativeDiagnostic[]): void {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  if (warnings.length === 0) return
  const lines = warnings.map(
    entry => `[neo] sync warning${diagnosticCodeSuffix(entry)}: ${entry.message}${diagnosticLocation(entry)}`
  )
  console.warn(lines.join('\n'))
}

// The compiler backchannel prints on its own console.warn call: every entry
// the engine returned (warnings AND infos — the channel is mostly info),
// one line each, so userspace keeps its single collapsed call untouched.
export function reportCompilerDiagnostics(entries: NativeDiagnostic[] | undefined): void {
  if (!entries || entries.length === 0) return
  const lines = entries.map(
    entry => `[neo] compiler${diagnosticCodeSuffix(entry)}: ${entry.message}${diagnosticLocation(entry)}`
  )
  console.warn(lines.join('\n'))
}
