/**
 * Cache helpers for matrix consumer node_modules hydration.
 *
 * The matrix runner wants two separate reuse layers:
 * - a pnpm content-addressed store shared across compatible runs
 * - a prelinked /consumer/node_modules tree reused only when the full install
 *   graph is identical for a matrix entry
 */

import { createHash } from 'node:crypto'
import type { RegistryManifestPackage } from '../../../registry/types.js'
import type { MatrixFixturePackageJson } from '../managed/package-json/index.js'

export const matrixNodeImage = 'node:24-bookworm'
export const matrixPnpmVersion = '10.29.3'

interface ReplaceWorkspaceProtocolVersionsOptions {
  dependencies?: Record<string, string>
  versionOverrides: Readonly<Record<string, string>>
}

interface MatrixNodeModulesCacheKeyOptions {
  containerImage?: string
  coreVersion: string
  fixturePackageJson: MatrixFixturePackageJson
  internalPackages: readonly Pick<RegistryManifestPackage, 'artifactHash' | 'hash' | 'name' | 'version'>[]
  libVersion: string
}

function createMatrixInstallGraph(
  options: MatrixNodeModulesCacheKeyOptions,
  fixtureName: string | null,
): string {
  const versionOverrides = {
    '@reference-ui/core': options.coreVersion,
    '@reference-ui/lib': options.libVersion,
  }

  return JSON.stringify(
    {
      fixtureName,
      manifestFingerprint: registryManifestFingerprint(options.internalPackages),
      dependencies: replaceWorkspaceProtocolVersions({
        dependencies: options.fixturePackageJson.dependencies,
        versionOverrides,
      }),
      devDependencies: replaceWorkspaceProtocolVersions({
        dependencies: options.fixturePackageJson.devDependencies,
        versionOverrides,
      }),
      nodeImage: options.containerImage ?? matrixNodeImage,
      packageManager: `pnpm@${matrixPnpmVersion}`,
    },
    null,
    2,
  )
}

function createMatrixNodeModulesCacheKey(prefix: string, installGraph: string): string {
  const digest = createHash('sha256').update(installGraph).digest('hex').slice(0, 16)
  return `${prefix}-${digest}`
}

export function externalPnpmStoreCacheKey(containerImage: string = matrixNodeImage): string {
  const digest = createHash('sha256')
    .update(JSON.stringify({
      containerImage,
      packageManager: `pnpm@${matrixPnpmVersion}`,
    }))
    .digest('hex')
    .slice(0, 16)

  return `reference-ui-pipeline-pnpm-store-externals-${digest}`
}

export function registryManifestFingerprint(
  packages: readonly Pick<RegistryManifestPackage, 'artifactHash' | 'hash' | 'name' | 'version'>[],
): string {
  const fingerprint = packages
    .map(pkg => `${pkg.name}@${pkg.version}:${pkg.artifactHash ?? pkg.hash}`)
    .sort((left, right) => left.localeCompare(right))
    .join('|')

  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16)
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

export function matrixSharedNodeModulesCacheKey(options: MatrixNodeModulesCacheKeyOptions): string {
  return createMatrixNodeModulesCacheKey(
    'reference-ui-pipeline-matrix-node-modules-shared',
    createMatrixInstallGraph(options, null),
  )
}

export function matrixNodeModulesCacheKey(options: MatrixNodeModulesCacheKeyOptions): string {
  // This graph intentionally excludes fixture source files so code edits do not
  // force a full reinstall when the dependency set is unchanged. The fixture
  // name remains part of the key so concurrently running consumers never share
  // the same writable node_modules volume.
  return createMatrixNodeModulesCacheKey(
    'reference-ui-pipeline-matrix-node-modules',
    createMatrixInstallGraph(options, options.fixturePackageJson.name),
  )
}
