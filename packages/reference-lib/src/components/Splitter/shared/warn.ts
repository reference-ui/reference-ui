/**
 * Splitter's dev-only diagnostic channel: warnSplitter logs a component-
 * tagged error outside production, and isProductionEnv exposes the same
 * gate the root's render-phase checks read. Both read the shared
 * isDevelopment().
 */
import { isDevelopment } from '../../../core/env/dev'

export function isProductionEnv(): boolean {
  return !isDevelopment()
}

export function warnSplitter(message: string) {
  if (isProductionEnv()) return
  console.error(`[Reference UI Splitter] ${message}`)
}
