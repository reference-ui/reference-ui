// Reference bridge result payloads: they take build outcomes and emit the
// structured serial-phase results. Neo has no event bus, so onRunBuild returns
// these instead of emitting `reference:complete` / `reference:failed`; the
// shapes stay close to the old events for the consumers Crew C2 wires later.

import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

export interface ReferenceBuildComplete {
  name?: string
  symbolId?: string
  source: 'project'
  manifestPath: string
  outputDir: string
  warningCount: number
  diagnosticCount: number
  diagnostics: readonly TastyBuildDiagnostic[]
}

export interface ReferenceBuildFailed {
  name?: string
  message: string
}

export type ReferenceBuildResult =
  | ({ status: 'complete' } & ReferenceBuildComplete)
  | ({ status: 'failed' } & ReferenceBuildFailed)
