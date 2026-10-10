/**
 * Toast document routing: tracks mounted host documents so untargeted API
 * calls resolve the caller's document. A single mounted document (or none,
 * falling back to globalThis document) resolves silently; multiple mounted
 * documents make untargeted calls ambiguous no-ops with a diagnostic, and
 * callers must pass { document } explicitly.
 */
import { toastDiagnostic } from '../shared/diagnostic'

const mountedToastDocuments = new Set<Document>()

export function registerToastDocument(doc: Document) {
  mountedToastDocuments.add(doc)
}

export function unregisterToastDocument(doc: Document) {
  mountedToastDocuments.delete(doc)
}

export function mountedToastDocumentCount() {
  return mountedToastDocuments.size
}

export function resolveToastDocument(explicit?: Document): Document | undefined {
  if (explicit) return explicit
  if (mountedToastDocuments.size > 1) {
    toastDiagnostic('toast: ambiguous untargeted call with multiple documents; pass { document }')
    return undefined
  }
  if (typeof document !== 'undefined') return document
  return undefined
}
