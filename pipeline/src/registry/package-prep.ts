/**
 * Publish-time package preparation for the local registry.
 *
 * This module stages package directories into a clean location, removes source-
 * only fields such as `private`, and rewrites `workspace:` protocol references
 * to concrete versions before `pnpm pack` runs.
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import type { WorkspacePackage } from '../build/types.js'
import { packedTarballName, stagingDir } from './paths.js'

export interface PackageJsonLike {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  private?: boolean
}

export function stagedPackageDirPath(pkg: WorkspacePackage): string {
  return resolve(stagingDir, basename(packedTarballName(pkg.name, pkg.version), '.tgz'))
}

export function resolveWorkspaceProtocolVersion(
  packageName: string,
  dependencySpec: string,
  workspacePackageVersions: ReadonlyMap<string, string>,
): string {
  if (!dependencySpec.startsWith('workspace:')) {
    return dependencySpec
  }

  const workspaceVersion = workspacePackageVersions.get(packageName)
  if (!workspaceVersion) {
    throw new Error(`Cannot resolve workspace dependency ${packageName} for local registry packaging.`)
  }

  const workspaceRange = dependencySpec.slice('workspace:'.length)
  if (workspaceRange === '' || workspaceRange === '*') {
    return workspaceVersion
  }

  if (workspaceRange === '^' || workspaceRange === '~') {
    return `${workspaceRange}${workspaceVersion}`
  }

  return workspaceRange
}

export function rewriteWorkspaceProtocolDependencies(
  dependencies: Record<string, string> | undefined,
  workspacePackageVersions: ReadonlyMap<string, string>,
): Record<string, string> | undefined {
  if (!dependencies) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([packageName, dependencySpec]) => [
      packageName,
      resolveWorkspaceProtocolVersion(packageName, dependencySpec, workspacePackageVersions),
    ]),
  )
}

export function preparePackageJsonForLocalRegistry(
  pkg: WorkspacePackage,
  packageJson: PackageJsonLike,
  workspacePackageVersions: ReadonlyMap<string, string>,
): PackageJsonLike {
  const preparedPackageJson: PackageJsonLike = {
    ...packageJson,
  }

  if (pkg.private) {
    delete preparedPackageJson.private
  }

  preparedPackageJson.dependencies = rewriteWorkspaceProtocolDependencies(
    packageJson.dependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.devDependencies = rewriteWorkspaceProtocolDependencies(
    packageJson.devDependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.optionalDependencies = rewriteWorkspaceProtocolDependencies(
    packageJson.optionalDependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.peerDependencies = rewriteWorkspaceProtocolDependencies(
    packageJson.peerDependencies,
    workspacePackageVersions,
  )

  return preparedPackageJson
}

export async function pruneStalePreparedPackages(activePreparedPackagePaths: ReadonlySet<string>): Promise<void> {
  try {
    const preparedEntries = await readdir(stagingDir, { withFileTypes: true })

    for (const entry of preparedEntries) {
      if (!entry.isDirectory()) {
        continue
      }

      const absolutePath = resolve(stagingDir, entry.name)
      if (activePreparedPackagePaths.has(absolutePath)) {
        continue
      }

      await rm(absolutePath, { force: true, recursive: true })
    }
  } catch {
    // Ignore missing directories.
  }
}

export async function prepareWorkspacePackageForLocalRegistry(
  pkg: WorkspacePackage,
  workspacePackageVersions: ReadonlyMap<string, string>,
): Promise<string> {
  const preparedPackageDir = stagedPackageDirPath(pkg)
  const preparedPackageJsonPath = resolve(preparedPackageDir, 'package.json')

  await rm(preparedPackageDir, { force: true, recursive: true })
  await mkdir(stagingDir, { recursive: true })

  await cp(pkg.dir, preparedPackageDir, {
    filter: (sourcePath) => {
      const sourceName = basename(sourcePath)
      return sourceName !== '.git' && sourceName !== 'node_modules'
    },
    recursive: true,
  })

  const packageJson = JSON.parse(await readFile(preparedPackageJsonPath, 'utf8')) as PackageJsonLike
  const preparedPackageJson = preparePackageJsonForLocalRegistry(
    pkg,
    packageJson,
    workspacePackageVersions,
  )

  await writeFile(preparedPackageJsonPath, `${JSON.stringify(preparedPackageJson, null, 2)}\n`)

  return preparedPackageDir
}