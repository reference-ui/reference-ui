/**
 * Rust target package metadata helpers.
 *
 * This module owns the pure transforms that derive package.json overrides and
 * validate that generated target package metadata stays aligned with the root
 * `@reference-ui/rust` version.
 */

import type { BuildPackageJsonOverride } from '../types.js'
import {
  getVirtualNativePackageName,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
} from '../../../../packages/reference-rs/js/shared/targets.js'

export interface ReferenceRustTargetPackageValidationOptions {
  rootVersion: string
  targetPackages: readonly Pick<{ name: string; version: string }, 'name' | 'version'>[]
}

export function getReferenceRustTargetPackageValidationErrors(
  options: ReferenceRustTargetPackageValidationOptions,
): string[] {
  const targetPackagesByName = new Map(
    options.targetPackages.map(targetPackage => [targetPackage.name, targetPackage]),
  )

  return SUPPORTED_VIRTUAL_NATIVE_TARGETS.flatMap((triple) => {
    const expectedName = getVirtualNativePackageName(triple)
    const targetPackage = targetPackagesByName.get(expectedName)

    if (!targetPackage) {
      return `Missing generated native package ${expectedName}@${options.rootVersion}.`
    }

    if (targetPackage.version !== options.rootVersion) {
      return `Generated native package ${targetPackage.name}@${targetPackage.version} does not match @reference-ui/rust@${options.rootVersion}.`
    }

    return []
  })
}

export function createReferenceRustPackageJsonOverride(
  targetPackages: readonly Pick<{ name: string; version: string }, 'name' | 'version'>[],
): BuildPackageJsonOverride | undefined {
  if (targetPackages.length === 0) {
    return undefined
  }

  return {
    optionalDependencies: Object.fromEntries(
      targetPackages.map(targetPackage => [targetPackage.name, targetPackage.version]),
    ),
  }
}
