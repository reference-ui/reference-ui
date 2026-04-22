/**
 * Public registry subsystem facade.
 *
 * The registry implementation is split into smaller files so process control,
 * package preparation, manifest persistence, packing, and loading can evolve
 * independently without turning this module back into a grab bag.
 */

import { manifestPath } from './paths.js'

export { packPublicPackages } from './pack.js'
export {
  ensureLocalRegistryAndStagePublicPackages,
  loadPackedTarballsIntoLocalRegistry,
  rebuildLocalRegistryAndStagePublicPackages,
  stagePublicPackages,
} from './load.js'
export {
  cleanManagedLocalRegistry,
  ensureManagedLocalRegistry,
  rebuildManagedLocalRegistry,
  stopManagedLocalRegistry,
} from './runtime.js'
export { defaultRegistryUrl, manifestPath } from './paths.js'

export function registryManifestPath(): string {
  return manifestPath
}