/**
 * Public npm publication for staged release tarballs.
 *
 * Release publishes the current staged tarballs directly to npm rather than
 * materializing fresh versions during the command. The registry manifest stays
 * the artifact contract for that publish boundary.
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { releasePackageNames } from '../../config.js'
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
  return releasePackageNames.includes(pkg.name as (typeof releasePackageNames)[number])
}

export function isReleaseManifestPackage(pkg: RegistryManifestPackage): boolean {
  return isDirectReleasePackage(pkg) || isGeneratedRustReleasePackage(pkg)
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