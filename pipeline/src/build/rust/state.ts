/**
 * Build-owned rust packaging state.
 *
 * The Rust build pipeline prepares extra npm-style artifacts that the registry
 * should publish later, but the registry should not need to know how those
 * artifacts were produced. This file stores that handoff state.
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type {
  BuildPackageJsonOverride,
  BuildRegistryArtifacts,
  BuildRegistryArtifactPackage,
} from '../types.js'
import { pipelineStateDir } from '../workspace.js'

const rustBuildArtifactsVersion = 1 as const
const rustBuildArtifactsDir = resolve(pipelineStateDir, 'build', 'rust')
const rustBuildArtifactsPath = resolve(rustBuildArtifactsDir, 'registry-artifacts.json')

export const rustGeneratedTarballsDir = resolve(rustBuildArtifactsDir, 'tarballs')

export function emptyRustBuildRegistryArtifacts(): BuildRegistryArtifacts {
  return {
    generatedPackages: [],
    packageHashAugmentations: {},
    preparedPackageJsonOverrides: {},
  }
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

export async function readRustBuildRegistryArtifacts(): Promise<BuildRegistryArtifacts> {
  try {
    const contents = await readFile(rustBuildArtifactsPath, 'utf8')
    const artifacts = JSON.parse(contents) as { version?: number }

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