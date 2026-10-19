/**
 * Build-owned Rust packaging facade.
 *
 * Coordinates Rust-specific staging work through focused helper modules: target
 * tarball preparation, prepared-state persistence, and registry-stage override
 * application. Callers get registry-ready artifacts plus cache keys without
 * touching napi-rs details.
 */

import type { WorkspacePackage } from '../types.js'
import type { BuildRegistryArtifacts } from '../types.js'
import {
  getReferenceNativeTriple,
  type ReferenceNativeTarget,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/targets.js'
import { computePackageBuildHashes } from '../cache.js'
import { logSkip } from '../../lib/log/index.js'
import { hashNativeInputs } from '../../../../packages/reference-rs/modules/runtime/js/shared/native-inputs.js'
import {
  applyPreparedRustPackageHash,
  applyPreparedRustPackageOverride,
} from './registry-overrides.js'
import { createReferenceRustPackageJsonOverride, materializeReferenceRustTargetTarballs, REFERENCE_RUST_PACKAGE_NAME } from './targets.js'
import {
  canReuseRustBuildRegistryArtifacts,
  createRustBuildRegistryArtifactsCacheKey,
  createRustBuildHashAugmentation,
  emptyRustBuildRegistryArtifacts,
  readRustBuildRegistryArtifacts,
  writeRustBuildRegistryArtifacts,
} from './state.js'

export interface PrepareReferenceRustRegistryArtifactsOptions {
  forceBuildNativeTargets?: boolean
  /** Sources hash the caller already keyed its cache on, so key and artifacts describe the same sources. */
  inputsHash?: string
  requiredTargets?: readonly ReferenceNativeTarget[]
}

export async function prepareReferenceRustRegistryArtifacts(
  packageDir: string,
  options: PrepareReferenceRustRegistryArtifactsOptions = {},
): Promise<BuildRegistryArtifacts> {
  const { generatedPackages, leftOutWarnings } = await materializeReferenceRustTargetTarballs(packageDir, options)
  const override = createReferenceRustPackageJsonOverride(
    generatedPackages.map(generatedPackage => ({
      name: generatedPackage.name,
      version: generatedPackage.version,
    })),
  )
  const packageHashAugmentation = createRustBuildHashAugmentation(generatedPackages, override)

  if (generatedPackages.length === 0 && !override) {
    return { ...emptyRustBuildRegistryArtifacts(), leftOutWarnings }
  }

  return {
    generatedPackages,
    leftOutWarnings,
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
  options: PrepareReferenceRustRegistryArtifactsOptions = {},
): Promise<void> {
  const rustPackage = buildTargets.find(pkg => pkg.name === REFERENCE_RUST_PACKAGE_NAME)

  if (!rustPackage) {
    await writeRustBuildRegistryArtifacts(emptyRustBuildRegistryArtifacts())
    return
  }

  const rustPackageHash = computePackageBuildHashes(buildTargets).get(rustPackage.name)

  if (!rustPackageHash) {
    throw new Error(`Missing build hash for ${rustPackage.name}`)
  }

  // Hashed once: a source edit between the cache key and the pack must not give them different sources.
  const inputsHash = hashNativeInputs(rustPackage.dir)
  const cacheKey = createRustBuildRegistryArtifactsCacheKey(
    rustPackageHash,
    options.requiredTargets,
    options.forceBuildNativeTargets,
    inputsHash,
    getReferenceNativeTriple(),
  )
  const cachedArtifacts = await readRustBuildRegistryArtifacts()

  if (canReuseRustBuildRegistryArtifacts(cachedArtifacts, cacheKey)) {
    logSkip(`Skipping prepared Rust registry artifacts for ${rustPackage.name}; inputs unchanged`)
    return
  }

  await writeRustBuildRegistryArtifacts(
    {
      ...(await prepareReferenceRustRegistryArtifacts(rustPackage.dir, { ...options, inputsHash })),
      cacheKey,
    },
  )
}

export async function readPreparedRustBuildRegistryArtifacts(): Promise<BuildRegistryArtifacts> {
  return readRustBuildRegistryArtifacts()
}

export { applyPreparedRustPackageHash, applyPreparedRustPackageOverride }