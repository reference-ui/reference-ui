import type { ReferenceUIConfig } from '../config'

export interface SyncOptions {
  build?: boolean
  watch?: boolean
  debug?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  configDependencyPaths?: string[]
  options: SyncOptions
}

/** Sync module events – complete and failure. */
export type SyncEvents = {
  /** Emitted when sync pipeline is complete (packager and MCP model finished). */
  'sync:complete': Record<string, never>
  /** Emitted when config or Panda failed; pipeline did not produce artifacts. */
  'sync:failed': Record<string, never>
}
