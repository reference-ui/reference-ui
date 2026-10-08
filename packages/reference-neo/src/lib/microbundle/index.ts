// Barrel for the Neo-owned microbundle seam.
// It takes nothing and re-exports the bundlers plus options, externals, and
// the canon base. Consumers bundle config and fragment sources through this
// single surface.

export { microBundle, microBundleWithResult } from './microbundle.ts'
export type { MicroBundleOptions, MicroBundleResult } from './types.ts'
export { DEFAULT_EXTERNALS } from './externals.ts'
export { NEO_PACKAGE_ROOT } from './build-options.ts'
