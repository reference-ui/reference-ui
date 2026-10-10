/**
 * Announcer's development warning: announcerDiagnostic prefixes with
 * [reference-ui], warns once per message shape, and stays silent in
 * production. The store's ambiguous-document guard is the only caller;
 * warn() knows nothing about live regions so any Announcer module can
 * share it. The process handle is read through globalThis because the
 * package declares no node types.
 */

const globalProcess = (globalThis as { process?: { env: { NODE_ENV?: string } } }).process
const warnedAnnouncerDiagnostics = new Set<string>()

export function announcerDiagnostic(message: string) {
  if (typeof globalProcess === 'undefined' || globalProcess.env.NODE_ENV === 'production') return
  if (warnedAnnouncerDiagnostics.has(message)) return
  warnedAnnouncerDiagnostics.add(message)
  console.warn(`[reference-ui] ${message}`)
}
