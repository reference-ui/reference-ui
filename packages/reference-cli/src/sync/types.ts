import type { ReferenceUIConfig } from '../config'

export interface SyncOptions {
  watch?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  options: SyncOptions
}
