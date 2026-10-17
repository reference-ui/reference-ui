/**
 * Tree's development diagnostic: treeDiagnostic errors with the
 * [reference-ui] Tree prefix and stays silent in production; the gate is
 * the shared isDevelopment(). The root's nested-onChange guard and the
 * unmatched-id diagnostics are the callers; this file knows nothing about
 * items, so any Tree module can share it.
 */
import { isDevelopment } from '../../../core/env/dev'

// Read at call time so callers can skip dev-only work in production too.
export function treeDiagnosticsEnabled(): boolean {
  return isDevelopment()
}

export function treeDiagnostic(message: string) {
  if (treeDiagnosticsEnabled()) {
    console.error(`[reference-ui] Tree: ${message}`)
  }
}
