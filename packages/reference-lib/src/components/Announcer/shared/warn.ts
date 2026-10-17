/**
 * Announcer's development warning: announcerDiagnostic prefixes with
 * [reference-ui], warns once per message shape, and stays silent in
 * production. The store's ambiguous-document guard is the only caller;
 * warn() knows nothing about live regions so any Announcer module can
 * share it. The gate is the shared isDevelopment().
 */
import { isDevelopment } from '../../../core/env/dev'

const warnedAnnouncerDiagnostics = new Set<string>()

export function announcerDiagnostic(message: string) {
  if (!isDevelopment()) return
  if (warnedAnnouncerDiagnostics.has(message)) return
  warnedAnnouncerDiagnostics.add(message)
  console.warn(`[reference-ui] ${message}`)
}
