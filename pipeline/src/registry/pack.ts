/**
 * Registry pack workflow.
 *
 * This module prepares publish-style package directories, packs them into npm
 * tarballs, and records the resulting artifact set in a manifest for later load
 * into Verdaccio.
 */

import { constants } from 'node:fs'
import { access, mkdir, readdir, rm } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { REGISTRY_PACKAGE_NAMES } from '../../config.js'
import { computePackageBuildHashes } from '../build/cache.js'
import {
  applyPreparedRustPackageHash,
  applyPreparedRustPackageOverride,
  prepareAndWriteRustBuildRegistryArtifacts,
  readPreparedRustBuildRegistryArtifacts,
  type PrepareReferenceRustRegistryArtifactsOptions,
} from '../build/rust/index.js'
import type { WorkspacePackage } from '../build/types.js'
import {
  listRegistryWorkspacePackages,
  listWorkspacePackages,
  repoRoot,
  run,
  sortPackagesForInternalDependencyOrder,
} from '../build/workspace.js'
import { logSkip } from '../lib/log/index.js'
import { readPreviousRegistryManifest, writeRegistryManifest } from './manifest.js'
import {
  prepareWorkspacePackageForLocalRegistry,
  pruneStalePreparedPackages,
  stagedPackageDirPath,
} from './package-prep.js'
import { defaultRegistryUrl, packedTarballName, tarballsDir } from './paths.js'
import { registryManifestVersion, type RegistryManifest, type RegistryManifestPackage } from './types.js'

function packageInternalDependencies(
  pkg: WorkspacePackage,
  packageNames: ReadonlySet<string>,
): string[] {
  return Object.keys(pkg.dependencies)
    .filter((dependencyName) => packageNames.has(dependencyName))
    .sort((a, b) => a.localeCompare(b))
}

async function pruneStaleTarballs(activeTarballPaths: ReadonlySet<string>): Promise<void> {
  try {
    const tarballEntries = await readdir(tarballsDir, { withFileTypes: true })

    for (const entry of tarballEntries) {
      if (!entry.isFile()) {
        continue
      }

      const absolutePath = resolve(tarballsDir, entry.name)
      if (activeTarballPaths.has(absolutePath)) {
        continue
      }

      await rm(absolutePath, { force: true })
    }
  } catch {
    // Ignore missing directories.
  }
}

export async function packPublicPackages(
  packageNames: readonly string[] = REGISTRY_PACKAGE_NAMES,
  rustOptions: PrepareReferenceRustRegistryArtifactsOptions = {},
): Promise<RegistryManifest> {
  const publicPackages = sortPackagesForInternalDependencyOrder(listRegistryWorkspacePackages(packageNames))
  await prepareAndWriteRustBuildRegistryArtifacts(publicPackages, rustOptions)
  const rustBuildArtifacts = await readPreparedRustBuildRegistryArtifacts()
  const publicPackageNames = new Set([
    ...publicPackages.map((pkg) => pkg.name),
    ...rustBuildArtifacts.generatedPackages.map((pkg) => pkg.name),
  ])
  const workspacePackageVersions = new Map(
    listWorkspacePackages().map((workspacePkg) => [workspacePkg.name, workspacePkg.version]),
  )
  const publicPackageHashes = computePackageBuildHashes(publicPackages)
  const previousManifest = await readPreviousRegistryManifest()
  const previousManifestByPackage = new Map(
    (previousManifest?.packages ?? []).map((pkg) => [pkg.name, pkg]),
  )

  await mkdir(tarballsDir, { recursive: true })

  const manifestPackages: RegistryManifestPackage[] = []
  const activeTarballPaths = new Set<string>()
  const activePreparedPackagePaths = new Set<string>()

  for (const pkg of publicPackages) {
    const packageHash = publicPackageHashes.get(pkg.name)
    if (!packageHash) {
      throw new Error(`Missing registry hash for ${pkg.name}`)
    }
    const effectivePackageHash = applyPreparedRustPackageHash(pkg.name, packageHash, rustBuildArtifacts)

    const tarballFileName = packedTarballName(pkg.name, pkg.version)
    const tarballPath = resolve(tarballsDir, tarballFileName)
    const previousPackage = previousManifestByPackage.get(pkg.name)
    const preparedPackageDir = stagedPackageDirPath(pkg)

    if (!(previousPackage?.hash === effectivePackageHash && previousPackage.tarballFileName === tarballFileName)) {
      await rm(tarballPath, { force: true })

      await prepareWorkspacePackageForLocalRegistry(pkg, workspacePackageVersions)
      await applyPreparedRustPackageOverride(pkg.name, preparedPackageDir, rustBuildArtifacts)

      await run('pnpm', ['pack', '--pack-destination', tarballsDir], {
        cwd: preparedPackageDir,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Pack ${pkg.name}`,
      })
    } else {
      logSkip(`Skipping pack for ${pkg.name}; tarball hash unchanged`)
    }

    await access(tarballPath, constants.F_OK)
    activeTarballPaths.add(tarballPath)
    activePreparedPackagePaths.add(preparedPackageDir)

    manifestPackages.push({
      hash: effectivePackageHash,
      internalDependencies: packageInternalDependencies(pkg, publicPackageNames),
      name: pkg.name,
      sourceDir: relative(repoRoot, pkg.dir),
      tarballFileName,
      tarballPath: relative(repoRoot, tarballPath),
      version: pkg.version,
    })
  }

  for (const generatedPackage of rustBuildArtifacts.generatedPackages) {
    const generatedTarballPath = resolve(repoRoot, generatedPackage.tarballPath)
    await access(generatedTarballPath, constants.F_OK)
    activeTarballPaths.add(generatedTarballPath)
    manifestPackages.push(generatedPackage)
  }

  await pruneStaleTarballs(activeTarballPaths)
  await pruneStalePreparedPackages(activePreparedPackagePaths)

  const manifest: RegistryManifest = {
    generatedAt: new Date().toISOString(),
    packages: manifestPackages,
    registry: {
      defaultUrl: defaultRegistryUrl,
      kind: 'npm-compatible',
    },
    version: registryManifestVersion,
  }

  await writeRegistryManifest(manifest)

  return manifest
}