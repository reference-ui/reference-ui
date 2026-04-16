import type { ReferenceUIConfig } from '../../config'

export type TsPackagerCompletionEvent =
  | 'packager-ts:runtime:complete'
  | 'packager-ts:complete'

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

/**
 * What the DTS child process actually needs. We pass only this on argv (JSON) so we do not hit
 * `spawn E2BIG` when `config` is huge — POSIX limits the total size of argv + environment.
 */
export type TsPackagerDtsPayload = Pick<TsPackagerWorkerPayload, 'cwd' | 'packages'>
