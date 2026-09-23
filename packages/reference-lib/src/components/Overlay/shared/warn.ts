/** Dev-only Overlay diagnostics. Never throws. */

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Semantics identical in every state.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function overlayWarn(message: string) {
  const isProd = globalProcess?.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[Overlay] ${message}`)
  }
}
