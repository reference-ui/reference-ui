/**
 * Local release orchestration.
 *
 * This stage wires together planning, auth checks, versioning, and artifact
 * staging into the developer-facing local release command.
 */

import { defaultRegistryUrl } from '../registry/index.js'
import { ensureNpmAuth } from './auth.js'
import { assertLocalReleasePlanSupported, formatReleasePlan, getReleasePlan } from './plan.js'
import { stageLocalReleaseArtifacts } from './stage.js'
import type { ReleasePlan, RunLocalReleaseOptions } from './types.js'
import { defaultNpmAuthRegistryUrl } from './types.js'
import { materializeReleaseVersions } from './version.js'

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

  if (options.versionPackages !== false) {
    await materializeReleaseVersions()
  }

  await stageLocalReleaseArtifacts(options.registryUrl ?? defaultRegistryUrl)

  return releasePlan
}