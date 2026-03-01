import type { ReferenceUIConfig } from '../config'

export interface TsPackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
  /** Source entry path (e.g. 'src/entry/react.ts') - we emit .d.ts from this, not from bundled .js */
  packages: Array<{ name: string; sourceEntry: string; outFile: string }>
}
