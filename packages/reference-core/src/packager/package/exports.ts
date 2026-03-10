import type { PackageDefinition } from './type'

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
