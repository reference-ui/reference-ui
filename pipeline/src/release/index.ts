/**
 * Public release subsystem orchestrator.
 *
 * The CLI imports from this file so release behavior stays discoverable in one
 * place, while the underlying workflow stages live in focused neighboring files.
 */

export { ensureNpmAuth } from './auth.js'
export { parseChangesetStatus, readChangesetStatus } from './changesets.js'
export { runLocalRelease } from './local.js'
export {
  assertLocalReleasePlanSupported,
  createReleasePlan,
  formatReleasePlan,
  getReleasePlan,
} from './plan.js'
export {
  defaultNpmAuthRegistryUrl,
  rustPackageName,
} from './types.js'
export type {
  ChangesetStatus,
  ChangesetStatusRelease,
  ReleasePlan,
  ReleasePlanPackage,
  RunLocalReleaseOptions,
} from './types.js'
export { stageLocalReleaseArtifacts } from './stage.js'
export { materializeReleaseVersions } from './version.js'