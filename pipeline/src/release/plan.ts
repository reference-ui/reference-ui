/**
 * Release planning helpers.
 *
 * This stage translates raw Changesets status into a release plan, validates
 * that the current local pipeline can service it, and formats it for CLI use.
 */

import type { WorkspacePackage } from '../build/types.js'
import {
  listPublicWorkspacePackages,
  listRegistryWorkspacePackages,
  sortPackagesForInternalDependencyOrder,
} from '../build/workspace.js'
import { readChangesetStatus } from './changesets.js'
import type { ChangesetStatus, ReleasePlan, ReleasePlanPackage } from './types.js'
import { rustPackageName } from './types.js'

export function createReleasePlan(
  status: ChangesetStatus,
  workspacePackages: readonly WorkspacePackage[] = listPublicWorkspacePackages(),
): ReleasePlan {
  const packageByName = new Map(workspacePackages.map((pkg) => [pkg.name, pkg]))

  const releasePackages = status.releases.map((release): ReleasePlanPackage => {
    const pkg = packageByName.get(release.name)
    if (!pkg) {
      throw new Error(`Changesets release target ${release.name} was not found in the public workspace package set.`)
    }

    return {
      ...pkg,
      changesets: release.changesets,
      nextVersion: release.newVersion ?? pkg.version,
      previousVersion: release.oldVersion,
      releaseType: release.type,
    }
  })

  const sortedPackages = sortPackagesForInternalDependencyOrder(releasePackages) as ReleasePlanPackage[]

  return {
    changesetCount: status.changesets.length,
    needsRust: sortedPackages.some((pkg) => pkg.name === rustPackageName),
    packages: sortedPackages,
  }
}

export async function getReleasePlan(): Promise<ReleasePlan> {
  return createReleasePlan(await readChangesetStatus())
}

export function assertLocalReleasePlanSupported(
  releasePlan: ReleasePlan,
  supportedPackageNames: ReadonlySet<string> = new Set(
    listRegistryWorkspacePackages().map((pkg) => pkg.name),
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
      'No pending Changesets releases found.',
      `Changesets: ${releasePlan.changesetCount}`,
      'Release packages: 0',
    ].join('\n')
  }

  return [
    `Changesets: ${releasePlan.changesetCount}`,
    `Release packages: ${releasePlan.packages.length}`,
    `Rust release required: ${releasePlan.needsRust ? 'yes' : 'no'}`,
    '',
    ...releasePlan.packages.map((pkg) => {
      const releaseType = pkg.releaseType ? ` (${pkg.releaseType})` : ''
      return `- ${pkg.name} ${pkg.version} -> ${pkg.nextVersion}${releaseType}`
    }),
  ].join('\n')
}