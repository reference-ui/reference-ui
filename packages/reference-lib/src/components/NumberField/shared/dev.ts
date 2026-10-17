/**
 * NumberField's dev-only diagnostic channel: a component-tagged error
 * outside production. The gate is the shared isDevelopment().
 */
import { isDevelopment } from '../../../core/env/dev'

export function numberFieldDevDiagnostic(message: string) {
  if (!isDevelopment()) return
  console.error(`Reference UI: NumberField ${message}`)
}
