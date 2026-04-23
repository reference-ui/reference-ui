/**
 * Local release orchestration.
 *
 * This stage wires together planning, auth checks, build/pack preparation, and
 * public npm publication into the developer-facing release command.
 */

import { releasePackageNames } from '../../config.js'
import { buildWorkspaceArtifacts } from '../build/index.js'
import { packPublicPackages } from '../registry/index.js'
import { ensureNpmAuth } from './auth.js'
import { assertLocalReleasePlanSupported, formatReleasePlan, getReleasePlan } from './plan.js'
import { publishReleaseTarballsToNpm } from './publish.js'
import type { ReleasePlan, RunLocalReleaseOptions } from './types.js'
import { defaultNpmAuthRegistryUrl } from './types.js'

export async function runLocalRelease(options: RunLocalReleaseOptions = {}): Promise<ReleasePlan> {
  const releasePlan = await getReleasePlan()

  if (releasePlan.packages.length === 0) {
    console.log(formatReleasePlan(releasePlan))
    return releasePlan
  }

  assertLocalReleasePlanSupported(releasePlan)

  if (options.verifyNpmAuth !== false) {
    ensureNpmAuth(options.authRegistryUrl ?? defaultNpmAuthRegistryUrl)
  }

  console.log(formatReleasePlan(releasePlan))
  console.log('')

  await buildWorkspaceArtifacts(releasePackageNames)
  await packPublicPackages(releasePackageNames)
  await publishReleaseTarballsToNpm(options.authRegistryUrl ?? defaultNpmAuthRegistryUrl)
  console.log(`\nPublished release artifacts to ${options.authRegistryUrl ?? defaultNpmAuthRegistryUrl}`)

  return releasePlan
}