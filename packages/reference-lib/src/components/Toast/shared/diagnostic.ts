/**
 * Toast diagnostics: development-only console warnings for no-op calls
 * (missing document, unknown IDs) that would otherwise fail silently.
 * Erased in production via the NODE_ENV gate so hot paths stay quiet.
 * The package declares no node types, so the bare `process` global is
 * unresolvable in the narrow build program — read it through globalThis
 * with a file-local shape instead. Semantics identical in every state.
 */
const globalProcess = (globalThis as { process?: { env: { NODE_ENV?: string } } }).process

export function toastDiagnostic(message: string) {
  if (typeof globalProcess !== 'undefined' && globalProcess.env.NODE_ENV !== 'production') {
    console.warn(`[reference-ui] ${message}`)
  }
}
