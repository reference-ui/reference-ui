// Export-map helpers for Neo package definitions.
// They take a bundle name and emit the shared export pattern every bundled package manifest carries.
// One helper, not four literals, so the '.'-plus-subpath shape can only drift in one place.

import type { PackageDefinition } from './type.ts'

/** Shared export pattern for bundled modules: . → types + import */
export function createBundleExports(
  moduleName: string,
  options?: { includeStyles?: boolean }
): PackageDefinition['exports'] {
  const exports: PackageDefinition['exports'] = {
    '.': {
      types: `./${moduleName}.d.mts`,
      import: `./${moduleName}.mjs`,
    },
  }
  if (options?.includeStyles) {
    exports['./styles.css'] = './styles.css'
  }
  return exports
}
