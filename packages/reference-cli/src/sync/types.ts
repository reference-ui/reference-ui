import type { ReferenceUIConfig } from '../config'

export interface SyncOptions {
  watch?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  options: SyncOptions
}

/** Sync module events – maps event names to payload types. */
export type SyncEvents = {
  /** Emitted by sync hub when watch:change is processed; passed to workers */
  'sync:changed': { event: 'add' | 'change' | 'unlink'; path: string }
  /** Emitted when cold sync (packager, etc.) is complete */
  'sync:complete': Record<string, never>
  /** Emitted when virtual copy to .reference-ui/virtual is complete */
  'virtual:complete': Record<string, never>
}
