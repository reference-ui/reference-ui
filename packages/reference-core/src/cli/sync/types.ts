import type { ReferenceUIConfig } from '@reference-ui/cli/config'

export interface SyncOptions {
  watch?: boolean
}

export interface SyncPayload {
  cwd: string
  config: ReferenceUIConfig
  options: SyncOptions
}
