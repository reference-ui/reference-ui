/**
 * Tree's development diagnostic: treeDiagnostic errors with the
 * [reference-ui] Tree prefix and stays silent in production, where the
 * process handle is read through globalThis because the package declares
 * no node types. The root's nested-onChange guard is the only caller;
 * diagnose() knows nothing about trees so any Tree module can share it.
 */

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Same pattern as Combobox's diagnostic.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function treeDiagnostic(message: string) {
  const isProd = globalProcess?.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[reference-ui] Tree: ${message}`)
  }
}
