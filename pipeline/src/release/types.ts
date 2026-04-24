/**
 * Shared release models and constants.
 *
 * These types describe the handoff points between the release stages so the
 * orchestrator can stay thin and the stage modules can remain focused.
 */

import type { WorkspacePackage } from '../build/types.js'

export const defaultNpmAuthRegistryUrl = 'https://registry.npmjs.org'
export const rustPackageName = '@reference-ui/rust'

export interface ChangesetStatusRelease {
  changesets: string[]
  name: string
  newVersion?: string
  oldVersion?: string
  type?: string
}

export interface ChangesetStatus {
  changesets: string[]
  releases: ChangesetStatusRelease[]
}

export interface ReleasePlanPackage extends WorkspacePackage {
  published: boolean
}

export interface ReleasePlan {
  needsRust: boolean
  packages: ReleasePlanPackage[]
}

export interface RunLocalReleaseOptions {
  authRegistryUrl?: string
  verifyNpmAuth?: boolean
}