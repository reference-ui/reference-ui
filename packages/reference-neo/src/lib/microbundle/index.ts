// Barrel for the Neo-owned microbundle seam.
// It takes nothing and re-exports the bundlers plus options and externals.
// Consumers bundle config and fragment sources through this single surface.

export { microBundle, microBundleWithResult } from './microbundle.ts'
export type { MicroBundleOptions, MicroBundleResult } from './types.ts'
export { DEFAULT_EXTERNALS } from './externals.ts'
