import type { ReferenceUIConfig } from '../../config'

export interface TsPackageInput {
  name: string
  sourceEntry: string
  outFile: string
}

export interface TsPackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
  /** Packages that have a source entry (we emit .d.ts from source, not from bundled .js) */
  packages: TsPackageInput[]
}
