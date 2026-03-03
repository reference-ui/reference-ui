import type { ReferenceUIConfig } from '../config'

export interface SyncOptions {
  watch?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  options: SyncOptions
}

/** Sync module events – only complete. */
export type SyncEvents = {
  /** Emitted when sync pipeline is complete */
  'sync:complete': Record<string, never>
}
