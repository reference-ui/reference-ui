import type { ReferenceUIConfig } from '../config'

export interface ReferenceWorkerPayload {
  sourceDir: string
  config: ReferenceUIConfig
}
