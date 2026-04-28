/**
 * Local release orchestration.
 *
 * This stage wires together planning, auth checks, build/pack preparation, and
 * public npm publication into the developer-facing release command.
 */

import { RELEASE_PACKAGE_NAMES } from '../../config.js'
import { buildWorkspaceArtifacts } from '../build/index.js'
import { REFERENCE_RUST_PACKAGE_NAME, getLocallyBuildableReferenceRustTargets, getMissingLocalReleaseRustTargets } from '../build/rust/targets.js'
import { packPublicPackages } from '../registry/index.js'
import { ensureNpmAuth } from './auth.js'
import {
  assertLocalReleasePlanSupported,
  formatReleasePlan,
  getReleasePlan,
  isPendingChangesetVersionMaterializationError,
} from './plan.js'
import { publishReleaseTarballsToNpm } from './publish.js'
import type { ReleasePlan, RunLocalReleaseOptions } from './types.js'
import { defaultNpmAuthRegistryUrl } from './types.js'
import { materializeReleaseVersions } from './version.js'

interface ResolveLocalReleasePlanDependencies {
  getReleasePlan: () => Promise<ReleasePlan>
  materializeReleaseVersions: () => Promise<void>
}

interface AssertLocalRustReleaseSupportedDependencies {
  getLocallyBuildableReferenceRustTargets: () => string[]
  getMissingLocalReleaseRustTargets: (packageDir: string) => string[]
}

export async function resolveLocalReleasePlan(
  dependencies: ResolveLocalReleasePlanDependencies = {
    getReleasePlan,
    materializeReleaseVersions,
  },
): Promise<ReleasePlan> {
  try {
    return await dependencies.getReleasePlan()
  } catch (error) {
    if (!isPendingChangesetVersionMaterializationError(error)) {
      throw error
    }
  }

  await dependencies.materializeReleaseVersions()

  return dependencies.getReleasePlan()
}

export function assertLocalRustReleaseSupported(
  releasePlan: ReleasePlan,
  dependencies: AssertLocalRustReleaseSupportedDependencies = {
    getLocallyBuildableReferenceRustTargets,
    getMissingLocalReleaseRustTargets,
  },
): void {
  const rustPackage = releasePlan.packages.find((pkg) => pkg.name === REFERENCE_RUST_PACKAGE_NAME)

  if (!rustPackage) {
    return
  }

  const missingTargets = dependencies.getMissingLocalReleaseRustTargets(rustPackage.dir)

  if (missingTargets.length === 0) {
    return
  }

  const locallyBuildableTargets = dependencies.getLocallyBuildableReferenceRustTargets()

  throw new Error(
    [
      `Local release cannot publish ${REFERENCE_RUST_PACKAGE_NAME}@${rustPackage.version} from this machine yet.`,
      `Missing native targets: ${missingTargets.join(', ')}.`,
      `This local flow can currently materialize: ${locallyBuildableTargets.join(', ')}.`,
      'Provide the missing target artifacts under packages/reference-rs/artifacts (for example from your release CI or pipeline), or run the release from a machine that can build the full target set.',
    ].join(' '),
  )
}

export async function runLocalRelease(options: RunLocalReleaseOptions = {}): Promise<ReleasePlan> {
  const releasePlan = await resolveLocalReleasePlan()

  if (releasePlan.packages.length === 0) {
    console.log(formatReleasePlan(releasePlan))
    return releasePlan
  }

  assertLocalReleasePlanSupported(releasePlan)
  assertLocalRustReleaseSupported(releasePlan)

  if (options.verifyNpmAuth !== false) {
    ensureNpmAuth(options.authRegistryUrl ?? defaultNpmAuthRegistryUrl)
  }

  console.log(formatReleasePlan(releasePlan))
  console.log('')

  await buildWorkspaceArtifacts(RELEASE_PACKAGE_NAMES)
  await packPublicPackages(RELEASE_PACKAGE_NAMES, {
    forceBuildNativeTargets: releasePlan.needsRust,
  })
  await publishReleaseTarballsToNpm(options.authRegistryUrl ?? defaultNpmAuthRegistryUrl)
  console.log(`\nPublished release artifacts to ${options.authRegistryUrl ?? defaultNpmAuthRegistryUrl}`)

  return releasePlan
}