/**
 * Dev-only diagnostic writer: calendarDevDiagnostic prefixes the message
 * and stays silent in production. Every fail-closed gate and renderer
 * validation funnels through here so diagnostics read the same everywhere.
 */
// Combobox/Splitter globalProcess pattern: the package declares no node
// types, so process comes via globalThis.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function calendarDevDiagnostic(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`[reference-ui] Calendar: ${message}`)
}
