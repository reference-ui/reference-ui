// Barrel for Neo package-definition helpers.
// It takes nothing and re-exports the definition type plus the name and exports helpers.
// Legs import the packager through here and never reach into the helper files directly.

export { getShortName } from './name.ts'
export { createBundleExports } from './exports.ts'

export type { PackageDefinition } from './type.ts'
