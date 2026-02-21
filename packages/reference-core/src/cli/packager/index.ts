import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

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
  config: ReferenceUIConfig
): Promise<void> {
  await runWorker('packager', { cwd, config })
}

// Re-export for use in other modules
export { bundleAllPackages, bundlePackage } from './bundler'
export { PACKAGES, SYSTEM_PACKAGE, REACT_PACKAGE } from './packages'
export type { PackageDefinition } from './packages'
