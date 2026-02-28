/**
 * Package definition and utilities for Reference UI
 */

export interface PackageDefinition {
  name: string
  version: string
  description: string
  /** Entry point for bundling (if bundle: true) */
  entry?: string
  /** Whether to bundle with esbuild (false = just copy files) */
  bundle?: boolean
  /** Directories to copy (when bundle: false) */
  copyDirs?: Array<{ src: string; dest?: string }>
  /** Main entry point for package.json (defaults to './index.js') */
  main?: string
  /** Types entry point for package.json (defaults to './index.d.ts') */
  types?: string
  exports: Record<string, unknown>
  /** Additional files to copy (e.g., styles.css) */
  additionalFiles?: Array<{ src: string; dest: string }>
}

/** Extract short name from scoped package (e.g. '@reference-ui/react' → 'react') */
export function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}

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
