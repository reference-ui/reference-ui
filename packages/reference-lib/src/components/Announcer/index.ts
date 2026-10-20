/**
 * Announcer public API — frozen (see README).
 *
 * `announce` + `AnnounceOptions` only. Everything else (host, snapshot probe,
 * constants, document registry, diagnostics, store) lives in `./internal`
 * for ReferenceLibrary and tests. No shims: pre-release breaking.
 */
export { announce } from './store'
export type { AnnounceOptions } from './types'
