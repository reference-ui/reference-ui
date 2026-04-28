/**
 * Public npm publication for staged release tarballs.
 *
 * Release publishes the current staged tarballs directly to npm rather than
 * materializing fresh versions during the command. The registry manifest stays
 * the artifact contract for that publish boundary.
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { RELEASE_PACKAGE_NAMES } from '../../config.js'
import { createNpmCommandEnv, repoRoot, run } from '../build/workspace.js'
import { logSkip } from '../lib/log/index.js'
import { readRegistryManifest } from '../registry/manifest.js'
import type { RegistryManifestPackage } from '../registry/types.js'
import { defaultNpmAuthRegistryUrl, rustPackageName } from './types.js'

export function shouldPublishWithProvenance(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.REF_RELEASE_PROVENANCE ?? env.NPM_CONFIG_PROVENANCE ?? env.npm_config_provenance
  return value === 'true' || value === '1'
}

export function publishArgsForTarball(
  tarballPath: string,
  registryUrl: string,
  includeProvenance: boolean,
): string[] {
  return [
    'publish',
    tarballPath,
    '--registry',
    registryUrl,
    '--access',
    'public',
    ...(includeProvenance ? ['--provenance'] : []),
  ]
}

function isPublishedOnNpm(name: string, version: string, registryUrl: string): boolean {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--registry', registryUrl, '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: createNpmCommandEnv(registryUrl),
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    return output.length > 0
  } catch {
    return false
  }
}

function isGeneratedRustReleasePackage(pkg: RegistryManifestPackage): boolean {
  return pkg.sourceDir.startsWith('packages/reference-rs/npm/')
}

function isDirectReleasePackage(pkg: RegistryManifestPackage): boolean {
  return RELEASE_PACKAGE_NAMES.includes(pkg.name as (typeof RELEASE_PACKAGE_NAMES)[number])
}

export function isReleaseManifestPackage(pkg: RegistryManifestPackage): boolean {
  return isDirectReleasePackage(pkg) || isGeneratedRustReleasePackage(pkg)
}

export function assertRustRootPublishIsSafe(
  packages: readonly RegistryManifestPackage[],
  registryUrl: string,
  isPublished: (name: string, version: string, registryUrl: string) => boolean = isPublishedOnNpm,
): void {
  const rustRootPackage = packages.find(pkg => pkg.name === rustPackageName)
  if (!rustRootPackage || isPublished(rustRootPackage.name, rustRootPackage.version, registryUrl)) {
    return
  }

  const alreadyPublishedNativePackages = packages
    .filter(isGeneratedRustReleasePackage)
    .filter(pkg => isPublished(pkg.name, pkg.version, registryUrl))

  if (alreadyPublishedNativePackages.length === 0) {
    return
  }

  throw new Error(
    [
      `Refusing to publish ${rustRootPackage.name}@${rustRootPackage.version} because native target packages are already published for that version.`,
      `Published native packages: ${alreadyPublishedNativePackages.map(pkg => `${pkg.name}@${pkg.version}`).join(', ')}.`,
      'Publishing the root package now could mix new JS artifacts with older native binaries.',
      'Cut a new version before retrying the release.',
    ].join(' '),
  )
}

function sortPackagesByInternalDependencies(packages: readonly RegistryManifestPackage[]): RegistryManifestPackage[] {
  const packageMap = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const incomingCount = new Map(packages.map((pkg) => [pkg.name, 0]))
  const dependents = new Map(packages.map((pkg) => [pkg.name, [] as string[]]))

  for (const pkg of packages) {
    for (const dependencyName of pkg.internalDependencies) {
      if (!packageMap.has(dependencyName)) {
        continue
      }

      incomingCount.set(pkg.name, (incomingCount.get(pkg.name) ?? 0) + 1)
      dependents.get(dependencyName)?.push(pkg.name)
    }
  }

  const queue = packages
    .map((pkg) => pkg.name)
    .filter((name) => (incomingCount.get(name) ?? 0) === 0)
    .sort((left, right) => left.localeCompare(right))
  const sorted: RegistryManifestPackage[] = []

  while (queue.length > 0) {
    const name = queue.shift()
    if (!name) {
      break
    }

    const pkg = packageMap.get(name)
    if (!pkg) {
      continue
    }

    sorted.push(pkg)

    for (const dependentName of [...(dependents.get(name) ?? [])].sort((left, right) => left.localeCompare(right))) {
      const nextCount = (incomingCount.get(dependentName) ?? 0) - 1
      incomingCount.set(dependentName, nextCount)
      if (nextCount === 0) {
        queue.push(dependentName)
        queue.sort((left, right) => left.localeCompare(right))
      }
    }
  }

  if (sorted.length === packages.length) {
    return sorted
  }

  const sortedNames = new Set(sorted.map((pkg) => pkg.name))

  return [
    ...sorted,
    ...packages
      .filter((pkg) => !sortedNames.has(pkg.name))
      .sort((left, right) => left.name.localeCompare(right.name)),
  ]
}

export function sortReleaseManifestPackages(packages: readonly RegistryManifestPackage[]): RegistryManifestPackage[] {
  const releasePackages = packages.filter(isReleaseManifestPackage)
  const generatedRustPackages = releasePackages
    .filter(isGeneratedRustReleasePackage)
    .sort((left, right) => left.name.localeCompare(right.name))
  const directReleasePackages = sortPackagesByInternalDependencies(
    releasePackages.filter((pkg) => !isGeneratedRustReleasePackage(pkg)),
  )

  return [...generatedRustPackages, ...directReleasePackages]
}

export async function publishReleaseTarballsToNpm(
  registryUrl: string = defaultNpmAuthRegistryUrl,
): Promise<void> {
  const manifest = await readRegistryManifest()
  const releasePackages = sortReleaseManifestPackages(manifest.packages)
  const includeProvenance = shouldPublishWithProvenance()

  assertRustRootPublishIsSafe(releasePackages, registryUrl)

  for (const pkg of releasePackages) {
    if (isPublishedOnNpm(pkg.name, pkg.version, registryUrl)) {
      logSkip(`Skipping ${pkg.name}@${pkg.version}; already present on ${registryUrl}`)
      continue
    }

    await run('npm', publishArgsForTarball(resolve(repoRoot, pkg.tarballPath), registryUrl, includeProvenance), {
      env: createNpmCommandEnv(registryUrl),
      interactive: true,
      label: `Publish ${pkg.name}@${pkg.version}`,
    })
  }
}