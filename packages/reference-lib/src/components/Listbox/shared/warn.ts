/**
 * Listbox's dev-only diagnostic channel: warnListbox logs a component-tagged
 * error outside production, and isProductionEnv exposes the same gate the
 * root's checks read. Both read the shared isDevelopment().
 */
import { isDevelopment } from '../../../core/env/dev'

export function isProductionEnv(): boolean {
  return !isDevelopment()
}

export function warnListbox(message: string) {
  if (isProductionEnv()) return
  console.error(`[Reference UI Listbox] ${message}`)
}
