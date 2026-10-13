/**
 * Local release artifact staging.
 *
 * This stage rebuilds the registry-target packages at their release versions
 * and loads the resulting publish-style artifacts into the managed Verdaccio
 * registry for local verification and promotion work.
 */

import { buildWorkspacePackages } from '../build/index.js'
import { defaultRegistryUrl } from '../registry/index.js'
import { SUPPORTED_REFERENCE_NATIVE_TARGETS } from '../../../packages/reference-rs/modules/runtime/js/shared/targets.js'

export async function stageLocalReleaseArtifacts(registryUrl: string = defaultRegistryUrl): Promise<void> {
  // Naming every native target makes the stage hard: a stale target this host cannot build refuses.
  await buildWorkspacePackages(registryUrl, undefined, { requiredRustTargets: SUPPORTED_REFERENCE_NATIVE_TARGETS })
  console.log(`\nStaged release artifacts into ${registryUrl}`)
}