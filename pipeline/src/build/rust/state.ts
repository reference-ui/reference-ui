/**
 * Build-owned rust packaging state.
 *
 * The Rust build pipeline prepares extra npm-style artifacts that the registry
 * should publish later, but the registry should not need to know how those
 * artifacts were produced. This file stores that handoff state.
 */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type {
  BuildPackageJsonOverride,
  BuildRegistryArtifacts,
  BuildRegistryArtifactPackage,
} from '../types.js'
import { repoRoot, pipelineStateDir } from '../workspace.js'
import { SUPPORTED_REFERENCE_NATIVE_TARGETS, type ReferenceNativeTarget } from '../../../../packages/reference-rs/modules/runtime/js/shared/targets.js'

// v5 stores leftOutWarnings, so artifacts written before it are re-prepared once to record them.
const rustBuildArtifactsVersion = 5 as const
const rustBuildArtifactsDir = resolve(pipelineStateDir, 'build', 'rust')
const rustBuildArtifactsPath = resolve(rustBuildArtifactsDir, 'registry-artifacts.json')

const rustGeneratedTarballsRootDir = resolve(rustBuildArtifactsDir, 'tarballs')

/**
 * Generated target tarballs are keyed by the native inputs hash they were packed
 * for. A tarball from older Rust sources then has no path to reuse under the
 * current sources; stale directories are pruned after a successful prepare.
 */
export function rustGeneratedTarballsDirFor(nativeInputsHash: string): string {
  return resolve(rustGeneratedTarballsRootDir, nativeInputsHash)
}

export { rustGeneratedTarballsRootDir }

function normalizeRequiredTargets(requiredTargets?: readonly ReferenceNativeTarget[]): ReferenceNativeTarget[] {
  return [...(requiredTargets ?? SUPPORTED_REFERENCE_NATIVE_TARGETS)].sort((left, right) => left.localeCompare(right))
}

export function emptyRustBuildRegistryArtifacts(): BuildRegistryArtifacts {
  return {
    cacheKey: undefined,
    generatedPackages: [],
    leftOutWarnings: [],
    packageHashAugmentations: {},
    preparedPackageJsonOverrides: {},
  }
}

/**
 * `nativeInputsHash` is the content hash of the Rust sources the native build
 * reads. Keying on it directly re-prepares the artifacts whenever those sources
 * change, even when the git-based package hash does not change with them.
 *
 * An implicit target set (undefined) is not the same request as an explicit list
 * naming every target: the implicit one may leave stale targets out, and the
 * explicit one must refuse. Reusing one for the other would hide a partial set.
 * The host is part of the key because what this host can build decides the outcome.
 */
export function createRustBuildRegistryArtifactsCacheKey(
  packageHash: string,
  requiredTargets?: readonly ReferenceNativeTarget[],
  forceBuildNativeTargets: boolean = false,
  nativeInputsHash?: string,
  hostTarget?: ReferenceNativeTarget | null,
): string {
  const hash = createHash('sha256')

  hash.update(packageHash)
  hash.update('\n')
  hash.update(forceBuildNativeTargets ? 'force-build-native-targets' : 'allow-native-cache')
  hash.update('\n')

  if (nativeInputsHash !== undefined) {
    hash.update(`native-inputs:${nativeInputsHash}`)
    hash.update('\n')
  }

  hash.update(`host:${hostTarget ?? 'unknown'}`)
  hash.update('\n')

  if (requiredTargets === undefined) {
    hash.update('targets:implicit')
    hash.update('\n')
    return hash.digest('hex')
  }

  hash.update('targets:explicit')
  hash.update('\n')

  for (const target of normalizeRequiredTargets(requiredTargets)) {
    hash.update(target)
    hash.update('\n')
  }

  return hash.digest('hex')
}

export function createRustBuildHashAugmentation(
  generatedPackages: readonly Pick<BuildRegistryArtifactPackage, 'hash' | 'name' | 'version'>[],
  override: BuildPackageJsonOverride | undefined,
): string | null {
  if (generatedPackages.length === 0 && !override) {
    return null
  }

  const hash = createHash('sha256')

  for (const generatedPackage of generatedPackages) {
    hash.update(generatedPackage.name)
    hash.update('\n')
    hash.update(generatedPackage.version)
    hash.update('\n')
    hash.update(generatedPackage.hash)
    hash.update('\n')
  }

  if (override) {
    hash.update(JSON.stringify(override))
    hash.update('\n')
  }

  return hash.digest('hex')
}

export function hasPreparedRustGeneratedTarballs(artifacts: BuildRegistryArtifacts): boolean {
  return artifacts.generatedPackages.every((generatedPackage) => existsSync(resolve(repoRoot, generatedPackage.tarballPath)))
}

/**
 * Artifacts that left a native target out are never reused: the key cannot see
 * the binary or stamp that would bring the target back (placed in dist/native or
 * dist/artifacts after the pack), so reuse would hide the fix and repeat the gap.
 * Re-preparing is cheap once every buildable target is fresh.
 */
export function canReuseRustBuildRegistryArtifacts(
  artifacts: BuildRegistryArtifacts,
  cacheKey: string,
): boolean {
  return artifacts.cacheKey === cacheKey
    && (artifacts.leftOutWarnings ?? []).length === 0
    && hasPreparedRustGeneratedTarballs(artifacts)
}

export async function readRustBuildRegistryArtifacts(): Promise<BuildRegistryArtifacts> {
  try {
    const contents = await readFile(rustBuildArtifactsPath, 'utf8')
    const artifacts = JSON.parse(contents) as BuildRegistryArtifacts & { version?: number }

    if (artifacts.version !== rustBuildArtifactsVersion) {
      return emptyRustBuildRegistryArtifacts()
    }

    return {
      ...emptyRustBuildRegistryArtifacts(),
      ...(artifacts as BuildRegistryArtifacts),
    }
  } catch {
    return emptyRustBuildRegistryArtifacts()
  }
}

export async function writeRustBuildRegistryArtifacts(artifacts: BuildRegistryArtifacts): Promise<void> {
  await mkdir(rustBuildArtifactsDir, { recursive: true })
  await writeFile(
    rustBuildArtifactsPath,
    `${JSON.stringify(
      {
        ...artifacts,
        version: rustBuildArtifactsVersion,
      },
      null,
      2,
    )}\n`,
  )
}