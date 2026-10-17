/**
 * Toast diagnostics: development-only console warnings for no-op calls
 * (missing document, unknown IDs) that would otherwise fail silently.
 * Silent in production via the shared isDevelopment() gate so hot paths
 * stay quiet.
 */
import { isDevelopment } from '../../../core/env/dev'

export function toastDiagnostic(message: string) {
  if (isDevelopment()) {
    console.warn(`[reference-ui] ${message}`)
  }
}
