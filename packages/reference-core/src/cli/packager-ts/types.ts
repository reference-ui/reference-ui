import type { ReferenceUIConfig } from '../config'

export interface TsPackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  packages: Array<{ name: string; entry: string }>
}
