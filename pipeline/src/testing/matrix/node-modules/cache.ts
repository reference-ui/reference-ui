/**
 * Cache helpers for matrix consumer node_modules hydration.
 *
 * The matrix runner wants two separate reuse layers:
 * - a pnpm content-addressed store shared across compatible runs
 * - a prelinked /consumer/node_modules tree reused only when the full install
 *   graph is identical for a matrix entry
 */

import { createHash } from 'node:crypto'
import type { RegistryManifest } from '../../../registry/types.js'
import type { MatrixFixturePackageJson } from '../transforms/package-json.js'

export const matrixNodeImage = 'node:24-bookworm'
export const matrixPnpmVersion = '10.29.3'

interface ReplaceWorkspaceProtocolVersionsOptions {
  dependencies?: Record<string, string>
  versionOverrides: Readonly<Record<string, string>>
}

interface MatrixNodeModulesCacheKeyOptions {
  coreVersion: string
  fixturePackageJson: MatrixFixturePackageJson
  libVersion: string
  manifest: RegistryManifest
}

export function registryManifestFingerprint(manifest: RegistryManifest): string {
  const fingerprint = manifest.packages
    .map(pkg => `${pkg.name}@${pkg.version}:${pkg.hash}`)
    .join('|')

  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16)
}

export function registryManifestCacheKey(manifest: RegistryManifest): string {
  return `reference-ui-pipeline-pnpm-store-${registryManifestFingerprint(manifest)}`
}

export function replaceWorkspaceProtocolVersions(
  options: ReplaceWorkspaceProtocolVersionsOptions,
): Record<string, string> | undefined {
  if (!options.dependencies) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(options.dependencies).map(([packageName, version]) => [
      packageName,
      version.startsWith('workspace:') ? (options.versionOverrides[packageName] ?? version) : version,
    ]),
  )
}

export function matrixNodeModulesCacheKey(options: MatrixNodeModulesCacheKeyOptions): string {
  const versionOverrides = {
    '@reference-ui/core': options.coreVersion,
    '@reference-ui/lib': options.libVersion,
  }

  // This graph intentionally excludes fixture source files so code edits do not
  // force a full reinstall when the dependency set is unchanged.
  const installGraph = JSON.stringify(
    {
      manifestFingerprint: registryManifestFingerprint(options.manifest),
      dependencies: replaceWorkspaceProtocolVersions({
        dependencies: options.fixturePackageJson.dependencies,
        versionOverrides,
      }),
      devDependencies: replaceWorkspaceProtocolVersions({
        dependencies: options.fixturePackageJson.devDependencies,
        versionOverrides,
      }),
      nodeImage: matrixNodeImage,
      packageManager: `pnpm@${matrixPnpmVersion}`,
    },
    null,
    2,
  )

  const digest = createHash('sha256').update(installGraph).digest('hex').slice(0, 16)
  return `reference-ui-pipeline-matrix-node-modules-${digest}`
}