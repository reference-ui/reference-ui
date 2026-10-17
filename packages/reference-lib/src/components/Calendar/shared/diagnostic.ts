/**
 * Dev-only diagnostic writer: calendarDevDiagnostic prefixes the message
 * and stays silent in production. Every fail-closed gate and renderer
 * validation funnels through here so diagnostics read the same everywhere.
 */
import { isDevelopment } from '../../../core/env/dev'

export function calendarDevDiagnostic(message: string) {
  if (!isDevelopment()) return
  console.error(`[reference-ui] Calendar: ${message}`)
}
