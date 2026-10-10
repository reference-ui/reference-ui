/**
 * Splitter's dev-only diagnostic channel: warnSplitter logs a component-
 * tagged error outside production, and isProductionEnv exposes the same
 * gate the root's render-phase checks read. The package declares no node
 * types, so process arrives via globalThis.
 */

const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function isProductionEnv(): boolean {
  return globalProcess?.env?.NODE_ENV === 'production'
}

export function warnSplitter(message: string) {
  if (isProductionEnv()) return
  console.error(`[Reference UI Splitter] ${message}`)
}
