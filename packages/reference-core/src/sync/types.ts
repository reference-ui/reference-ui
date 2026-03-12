import type { ReferenceUIConfig } from '../config'

export interface SyncOptions {
  watch?: boolean
  debug?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  options: SyncOptions
}

/** Sync module events – complete and failure. */
export type SyncEvents = {
  /** Emitted when sync pipeline is complete (packager finished). */
  'sync:complete': Record<string, never>
  /** Emitted when config or Panda failed; pipeline did not produce artifacts. */
  'sync:failed': Record<string, never>
}
