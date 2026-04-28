/**
 * Registry pack workflow.
 *
 * This module prepares publish-style package directories, packs them into npm
 * tarballs, and records the resulting artifact set in a manifest for later load
 * into Verdaccio.
 */

import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
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
  collectDeclaredPackagedPaths,
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

function readTarballEntries(tarballPath: string): string[] {
  const output = execFileSync('tar', ['-tf', tarballPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

  if (output.length === 0) {
    return []
  }

  return output.split('\n').filter((entry) => entry.length > 0)
}

function normalizeTarEntry(entry: string): string {
  return entry.replace(/^package\//, '').replace(/\/$/, '')
}

function computeTarballArtifactHash(tarballPath: string): string {
  return createHash('sha256').update(readFileSync(tarballPath)).digest('hex')
}

export function tarballContainsDeclaredPackagedPaths(
  tarballEntries: readonly string[],
  declaredPaths: readonly string[],
): boolean {
  const normalizedEntries = tarballEntries.map(normalizeTarEntry)

  return declaredPaths.every((declaredPath) => {
    const normalizedPath = declaredPath.replace(/^\.\//, '').replace(/\/$/, '')

    return normalizedEntries.some((entry) => entry === normalizedPath || entry.startsWith(`${normalizedPath}/`))
  })
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
    const declaredPackagedPaths = collectDeclaredPackagedPaths(pkg.packageJson ?? {})
    const canReuseExistingTarball = previousPackage?.hash === effectivePackageHash
      && previousPackage.tarballFileName === tarballFileName
      && tarballContainsDeclaredPackagedPaths(readTarballEntries(tarballPath), declaredPackagedPaths)

    if (!canReuseExistingTarball) {
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

    if (!tarballContainsDeclaredPackagedPaths(readTarballEntries(tarballPath), declaredPackagedPaths)) {
      throw new Error(`Packed tarball for ${pkg.name} is missing declared packaged outputs.`)
    }

    const artifactHash = computeTarballArtifactHash(tarballPath)

    activeTarballPaths.add(tarballPath)
    activePreparedPackagePaths.add(preparedPackageDir)

    manifestPackages.push({
      artifactHash,
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
    manifestPackages.push({
      ...generatedPackage,
      artifactHash: computeTarballArtifactHash(generatedTarballPath),
    })
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