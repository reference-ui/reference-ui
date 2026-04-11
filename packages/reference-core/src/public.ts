/**
 * Public authoring surface for `@reference-ui/core`.
 * Keep this separate from the executable CLI entry.
 */

export { defineConfig } from './config'
export type { ReferenceUIConfig } from './config'
export type { BaseSystem } from './types'
export { getSyncSession } from './session'
export type { SyncSession, RefreshEvent, GetSyncSessionOptions } from './session'
export { referenceVite } from './vite/plugin'
export type { ReferenceViteOptions } from './vite/types'
