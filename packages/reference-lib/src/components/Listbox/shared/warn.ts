/**
 * Listbox's dev-only diagnostic channel: warnListbox logs a component-tagged
 * error outside production, and isProductionEnv exposes the same gate the
 * root's checks read. The package declares no node types, so process arrives
 * via globalThis.
 */

const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
  .process

export function isProductionEnv(): boolean {
  return globalProcess?.env?.NODE_ENV === 'production'
}

export function warnListbox(message: string) {
  if (isProductionEnv()) return
  console.error(`[Reference UI Listbox] ${message}`)
}
