/**
 * Combobox's development diagnostic: comboboxDiagnostic errors with the
 * [reference-ui] Combobox prefix and stays silent in production, where
 * the process handle is read through globalThis because the package
 * declares no node types. Parts and hooks diagnose contract breaks
 * through it; it knows nothing about comboboxes.
 */

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Same pattern as Overlay's warn helper.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function comboboxDiagnostic(message: string) {
  const isProd = globalProcess?.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[reference-ui] Combobox: ${message}`)
  }
}
