/**
 * Release planning helpers.
 *
 * Release planning is based on the current workspace versions, not on
 * materializing a new version during the release command. The release command
 * publishes whichever configured release packages are currently unpublished.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createNpmCommandEnv, repoRoot, listReleaseWorkspacePackages, sortPackagesForInternalDependencyOrder } from '../build/workspace.js'
import type { WorkspacePackage } from '../build/types.js'
import { releasePackageNames } from '../../config.js'
import { readChangesetStatus } from './changesets.js'
import type { ReleasePlan, ReleasePlanPackage } from './types.js'
import type { ChangesetStatus } from './types.js'
import { defaultNpmAuthRegistryUrl, rustPackageName } from './types.js'

export const pendingChangesetVersionMaterializationErrorMessage =
  'Release planning found pending changesets, but the current release package versions are already published. Materialize the next release versions first, or run `pnpm release` to do it automatically.'

function isPublishedOnNpm(name: string, version: string, registryUrl: string = defaultNpmAuthRegistryUrl): boolean {
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

function countPendingChangesetFiles(): number {
  try {
    const changesetDir = resolve(repoRoot, '.changeset')

    return readdirSync(changesetDir, { withFileTypes: true }).filter(
      (entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md',
    ).length
  } catch {
    return 0
  }
}

export function changesetsRequireVersionMaterialization(
  changesetStatus: ChangesetStatus,
  releasePackages: readonly Pick<WorkspacePackage, 'name' | 'version'>[] = listReleaseWorkspacePackages(),
): boolean {
  const currentReleaseVersions = new Map(releasePackages.map((pkg) => [pkg.name, pkg.version]))
  const releasablePackageNames = new Set(releasePackageNames)

  return changesetStatus.releases.some((release) => {
    if (!releasablePackageNames.has(release.name as (typeof releasePackageNames)[number])) {
      return false
    }

    if (!release.newVersion) {
      return false
    }

    const currentVersion = currentReleaseVersions.get(release.name)
    return currentVersion !== undefined && currentVersion !== release.newVersion
  })
}

export function createReleasePlan(
  releasePackages: readonly ReleasePlanPackage[] = sortPackagesForInternalDependencyOrder(
    listReleaseWorkspacePackages()
      .filter((pkg) => !isPublishedOnNpm(pkg.name, pkg.version))
      .map((pkg) => ({
        ...pkg,
        published: false,
      })),
  ) as ReleasePlanPackage[],
): ReleasePlan {
  const sortedReleasePackages = sortPackagesForInternalDependencyOrder(releasePackages) as ReleasePlanPackage[]

  return {
    needsRust: sortedReleasePackages.some((pkg) => pkg.name === rustPackageName),
    packages: sortedReleasePackages,
  }
}

export async function getReleasePlan(): Promise<ReleasePlan> {
  const releaseWorkspacePackages = listReleaseWorkspacePackages()

  if (countPendingChangesetFiles() > 0) {
    const changesetStatus = await readChangesetStatus()

    if (changesetsRequireVersionMaterialization(changesetStatus, releaseWorkspacePackages)) {
      throw new Error(pendingChangesetVersionMaterializationErrorMessage)
    }
  }

  const releasePlan = createReleasePlan(
    sortPackagesForInternalDependencyOrder(
      releaseWorkspacePackages
        .filter((pkg) => !isPublishedOnNpm(pkg.name, pkg.version))
        .map((pkg) => ({
          ...pkg,
          published: false,
        })),
    ) as ReleasePlanPackage[],
  )

  if (releasePlan.packages.length > 0) {
    return releasePlan
  }

  if (countPendingChangesetFiles() > 0) {
    throw new Error(pendingChangesetVersionMaterializationErrorMessage)
  }

  return releasePlan
}

export function isPendingChangesetVersionMaterializationError(error: unknown): boolean {
  return error instanceof Error && error.message === pendingChangesetVersionMaterializationErrorMessage
}

export function assertLocalReleasePlanSupported(
  releasePlan: ReleasePlan,
  supportedPackageNames: ReadonlySet<string> = new Set(
    releasePackageNames,
  ),
): void {
  const unsupportedPackages = releasePlan.packages
    .map((pkg) => pkg.name)
    .filter((packageName) => !supportedPackageNames.has(packageName))

  if (unsupportedPackages.length === 0) {
    return
  }

  throw new Error(
    `Local release staging does not yet support: ${unsupportedPackages.join(', ')}. Add them to pipeline/config.ts before using release local.`,
  )
}

export function formatReleasePlan(releasePlan: ReleasePlan): string {
  if (releasePlan.packages.length === 0) {
    return [
      'No unpublished release packages found.',
      'Release packages: 0',
    ].join('\n')
  }

  return [
    'Release source: current workspace versions',
    `Release packages: ${releasePlan.packages.length}`,
    `Rust release required: ${releasePlan.needsRust ? 'yes' : 'no'}`,
    '',
    ...releasePlan.packages.map((pkg) => `- ${pkg.name}@${pkg.version}`),
  ].join('\n')
}