import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export interface InitPackagerOptions {
  watch?: boolean
}

/**
 * Initialize the packager system.
 *
 * Creates bundled packages for:
 * - @reference-ui/system (design tokens, CSS utilities)
 * - @reference-ui/react (components, runtime APIs)
 *
 * Uses esbuild to properly bundle and place packages in node_modules.
 */
export async function initPackager(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitPackagerOptions
): Promise<void> {
  await runWorker('packager', {
    cwd,
    config,
    watchMode: options?.watch ?? false,
  })
}

// Re-export for use in other modules
export { bundleAllPackages, bundlePackage } from './bundler'
export { PACKAGES, REACT_PACKAGE } from './packages'
export type { PackageDefinition } from './packages'
