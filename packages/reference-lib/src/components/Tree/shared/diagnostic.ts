/**
 * Tree's development diagnostic: treeDiagnostic errors with the
 * [reference-ui] Tree prefix and stays silent in production, where the
 * process handle is read through globalThis because the package declares
 * no node types. The root's nested-onChange guard and the unmatched-id
 * diagnostics are the callers; this file knows nothing about items, so any
 * Tree module can share it.
 */

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Same pattern as Combobox's diagnostic.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

// Read at call time so callers can skip dev-only work in production too.
export function treeDiagnosticsEnabled(): boolean {
  return globalProcess?.env?.NODE_ENV !== 'production'
}

export function treeDiagnostic(message: string) {
  if (treeDiagnosticsEnabled()) {
    console.error(`[reference-ui] Tree: ${message}`)
  }
}
