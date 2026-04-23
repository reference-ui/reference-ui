/**
 * Prepared Rust registry override application.
 *
 * The Rust build step stages extra target-package tarballs and a root-package
 * optional dependency override before registry packing happens. The registry
 * layer later consumes that prepared state in two ways:
 *
 * - the root `@reference-ui/rust` package hash must incorporate the prepared
 *   target-package set so manifest caching stays correct
 * - the staged root `package.json` must be rewritten to point at those target
 *   packages before the tarball is packed
 *
 * Keeping those application steps here makes the boundary explicit: `state.ts`
 * defines what was prepared, while this file defines how registry staging uses
 * it.
 */

import { createHash } from 'node:crypto'

import type { BuildRegistryArtifacts } from '../types.js'
import { applyPreparedRustPackageOverride as applyPreparedRustPackageJsonOverride } from './package-json.js'

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
  return applyPreparedRustPackageJsonOverride(packageName, preparedPackageDir, artifacts)
}