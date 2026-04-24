/**
 * Local release artifact staging.
 *
 * This stage rebuilds the registry-target packages at their release versions
 * and loads the resulting publish-style artifacts into the managed Verdaccio
 * registry for local verification and promotion work.
 */

import { buildWorkspacePackages } from '../build/index.js'
import { defaultRegistryUrl } from '../registry/index.js'

export async function stageLocalReleaseArtifacts(registryUrl: string = defaultRegistryUrl): Promise<void> {
  await buildWorkspacePackages(registryUrl)
  console.log(`\nStaged release artifacts into ${registryUrl}`)
}