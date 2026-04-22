/**
 * Build-owned Rust packaging facade.
 *
 * Registry staging only needs already-prepared packages, hash adjustments, and
 * optional root-package overrides. This module keeps the Rust-specific reasons
 * for those changes inside `build/rust/`.
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { WorkspacePackage } from '../types.js'
import type { BuildPackageJsonOverride, BuildRegistryArtifacts } from '../types.js'
import { createReferenceRustPackageJsonOverride, materializeReferenceRustTargetTarballs, REFERENCE_RUST_PACKAGE_NAME } from './targets.js'
import {
  createRustBuildHashAugmentation,
  emptyRustBuildRegistryArtifacts,
  readRustBuildRegistryArtifacts,
  writeRustBuildRegistryArtifacts,
} from './state.js'

export async function prepareReferenceRustRegistryArtifacts(
  packageDir: string,
): Promise<BuildRegistryArtifacts> {
  const generatedPackages = await materializeReferenceRustTargetTarballs(packageDir)
  const override = createReferenceRustPackageJsonOverride(
    generatedPackages.map(generatedPackage => ({
      name: generatedPackage.name,
      version: generatedPackage.version,
    })),
  )
  const packageHashAugmentation = createRustBuildHashAugmentation(generatedPackages, override)

  if (generatedPackages.length === 0 && !override) {
    return emptyRustBuildRegistryArtifacts()
  }

  return {
    generatedPackages,
    packageHashAugmentations: packageHashAugmentation
      ? {
          [REFERENCE_RUST_PACKAGE_NAME]: packageHashAugmentation,
        }
      : {},
    preparedPackageJsonOverrides: override
      ? {
          [REFERENCE_RUST_PACKAGE_NAME]: override,
        }
      : {},
  }
}

export async function prepareAndWriteRustBuildRegistryArtifacts(
  buildTargets: readonly WorkspacePackage[],
): Promise<void> {
  const rustPackage = buildTargets.find(pkg => pkg.name === REFERENCE_RUST_PACKAGE_NAME)

  if (!rustPackage) {
    await writeRustBuildRegistryArtifacts(emptyRustBuildRegistryArtifacts())
    return
  }

  await writeRustBuildRegistryArtifacts(await prepareReferenceRustRegistryArtifacts(rustPackage.dir))
}

export async function readPreparedRustBuildRegistryArtifacts(): Promise<BuildRegistryArtifacts> {
  return readRustBuildRegistryArtifacts()
}

export function applyPreparedRustPackageHash(
  packageName: string,
  packageHash: string,
  artifacts: BuildRegistryArtifacts,
): string {
  const hashAugmentation = artifacts.packageHashAugmentations[packageName]
  if (!hashAugmentation) {
    return packageHash
  }

  const hash = createHash('sha256')
  hash.update(packageHash)
  hash.update('\n')
  hash.update(hashAugmentation)
  hash.update('\n')
  return hash.digest('hex')
}

export async function applyPreparedRustPackageOverride(
  packageName: string,
  preparedPackageDir: string,
  artifacts: BuildRegistryArtifacts,
): Promise<void> {
  const override = artifacts.preparedPackageJsonOverrides[packageName]
  if (!override) {
    return
  }

  const packageJsonPath = resolve(preparedPackageDir, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
    optionalDependencies?: Record<string, string>
  }
  const mergedPackageJson = mergeOptionalDependencyOverride(packageJson, override)

  await writeFile(packageJsonPath, `${JSON.stringify(mergedPackageJson, null, 2)}\n`)
}

function mergeOptionalDependencyOverride(
  packageJson: { optionalDependencies?: Record<string, string> },
  override: BuildPackageJsonOverride,
): { optionalDependencies?: Record<string, string> } {
  return {
    ...packageJson,
    ...override,
    optionalDependencies: {
      ...(packageJson.optionalDependencies ?? {}),
      ...(override.optionalDependencies ?? {}),
    },
  }
}