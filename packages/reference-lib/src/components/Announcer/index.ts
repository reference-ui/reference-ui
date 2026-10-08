/**
 * Announcer public API — frozen (FEATURES.md #2).
 *
 * `announce` + `AnnounceOptions` only. Everything else (host, snapshot probe,
 * constants, document registry, diagnostics, store) lives in `./internal`
 * for ReferenceLibrary and tests. No shims: pre-release breaking.
 */
export { announce } from './Announcer'
export type { AnnounceOptions } from './Announcer'
