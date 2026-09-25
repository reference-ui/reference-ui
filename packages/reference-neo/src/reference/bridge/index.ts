// Bridge barrel: it takes the scheduler, runner, tasty build, report, result,
// payload, and path modules and emits the serial-phase surface sync wires.
// No workers, no bus, no virtual copy — the buried core scaffolds stay buried.

export { createReferenceBuildReport, tastyDiagnosticToNative } from './build-report.ts'
export { flushReferenceBuild, initReference } from './init.ts'
export {
  getReferenceManifestPath,
  getReferenceTastyDirPath,
} from './paths.ts'
export { onRunBuild } from './run.ts'
export {
  buildReferenceTastyScanOptions,
  getReferenceTastyBuild,
  loadReferenceSymbol,
  rebuildReferenceTastyBuild,
} from './tasty-build.ts'
export type {
  ReferenceBuildComplete,
  ReferenceBuildFailed,
  ReferenceBuildResult,
} from './events.ts'
export type { ReferenceBuildPayload } from './run.ts'
export type { ReferenceTastyBuildState, ReferenceTastyScanOptions } from './tasty-build.ts'
export type { ReferenceTastyPayload } from './types.ts'
