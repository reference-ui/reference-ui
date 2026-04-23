/**
 * Build-owned Rust packaging facade.
 *
 * This module now only coordinates Rust-specific staging work and hands off
 * focused responsibilities to the nearby helper files:
 *
 * - `targets.ts` prepares target-package tarballs
 * - `state.ts` persists prepared Rust build state
 * - `registry-overrides.ts` applies that prepared state during registry staging
 */

import type { WorkspacePackage } from '../types.js'
import type { BuildRegistryArtifacts } from '../types.js'
import {
  applyPreparedRustPackageHash,
  applyPreparedRustPackageOverride,
} from './registry-overrides.js'
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

export { applyPreparedRustPackageHash, applyPreparedRustPackageOverride }