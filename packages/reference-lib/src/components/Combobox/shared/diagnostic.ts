/**
 * Combobox's development diagnostic: comboboxDiagnostic errors with the
 * [reference-ui] Combobox prefix and stays silent in production. The gate
 * is the shared isDevelopment(). Parts and hooks diagnose contract breaks
 * through it; it knows nothing about comboboxes.
 */
import { isDevelopment } from '../../../core/env/dev'

export function comboboxDiagnostic(message: string) {
  if (isDevelopment()) {
    console.error(`[reference-ui] Combobox: ${message}`)
  }
}
