/**
 * Rust package.json override helpers.
 *
 * Registry staging sometimes needs to augment the prepared `@reference-ui/rust`
 * package manifest with generated target-package optional dependencies. Keeping
 * that transformation in its own module makes the package.json mutation easy to
 * test without pulling in the rest of the Rust build facade.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { BuildPackageJsonOverride, BuildRegistryArtifacts } from '../types.js'

interface PackageJsonWithOptionalDependencies {
  optionalDependencies?: Record<string, string>
  [key: string]: unknown
}

export function mergeOptionalDependencyOverride(
  packageJson: PackageJsonWithOptionalDependencies,
  override: BuildPackageJsonOverride,
): PackageJsonWithOptionalDependencies {
  return {
    ...packageJson,
    ...override,
    optionalDependencies: {
      ...(packageJson.optionalDependencies ?? {}),
      ...(override.optionalDependencies ?? {}),
    },
  }
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
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJsonWithOptionalDependencies
  const mergedPackageJson = mergeOptionalDependencyOverride(packageJson, override)

  await writeFile(packageJsonPath, `${JSON.stringify(mergedPackageJson, null, 2)}\n`)
}