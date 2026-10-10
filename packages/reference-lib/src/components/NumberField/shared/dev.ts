/**
 * NumberField's dev-only diagnostic channel: a component-tagged error
 * outside production. The package declares no node types, so process
 * arrives via globalThis (the Combobox/Splitter pattern).
 */

// Dev-only diagnostic writer (Combobox/Splitter globalProcess pattern:
// the package declares no node types, so process comes via globalThis).
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function numberFieldDevDiagnostic(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`Reference UI: NumberField ${message}`)
}
