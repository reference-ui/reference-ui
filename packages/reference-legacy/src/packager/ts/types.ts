export type TsPackagerCompletionEvent =
  | 'packager-ts:runtime:complete'
  | 'packager-ts:complete'

export interface TsPackageInput {
  name: '@reference-ui/react' | '@reference-ui/system' | '@reference-ui/types'
  sourceEntry: string
  outFile: string
}

export interface TsPackagerWorkerPayload {
  cwd: string
  watchMode?: boolean
  packages?: TsPackageInput[]
}

export interface RunPackagerTsPayload {
  cwd: string
  completionEvent: TsPackagerCompletionEvent
  packages?: TsPackageInput[]
}
