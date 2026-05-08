/**
 * Rust target planning helpers.
 *
 * This module owns the pure decision logic for local target build strategies,
 * missing-target detection, and tarball reuse strategy selection.
 */

import {
  getVirtualNativeTriple,
  getVirtualNativePackageName,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
  type VirtualNativeTarget,
} from '../../../../packages/reference-rs/js/shared/targets.js'

export type RustTargetTarballStrategy =
  | 'pack-local-binary'
  | 'reuse-cached-tarball'
  | 'fetch-published-tarball'
  | 'skip-target'

export type LocalReferenceRustTargetBuildStrategy =
  | 'reuse-host-binary'
  | 'build-darwin-cross-target'
  | 'build-windows-cross-target'
  | 'build-linux-with-dagger'
  | 'unavailable'

export interface ShouldBuildLinuxReferenceRustTargetWithDaggerOptions {
  forceBuild: boolean
  publishedOnNpm: boolean
  requiredTargets: readonly VirtualNativeTarget[]
  targetPackage: Pick<{ hasLocalBinary: boolean; name: string }, 'hasLocalBinary' | 'name'> | undefined
}

export interface FindMissingRequiredReferenceRustTargetsOptions {
  artifactTargets: readonly VirtualNativeTarget[]
  cachedTarballTargets: readonly VirtualNativeTarget[]
  locallyBuildableTargets: readonly VirtualNativeTarget[]
  publishedTargets: readonly VirtualNativeTarget[]
  requiredTargets: readonly VirtualNativeTarget[]
}

export interface ResolveLocalReferenceRustTargetBuildStrategyOptions {
  hostPlatform?: NodeJS.Platform
  hostTarget?: VirtualNativeTarget | null
  target: VirtualNativeTarget
}

export function shouldBuildLinuxReferenceRustTargetWithDagger(
  options: ShouldBuildLinuxReferenceRustTargetWithDaggerOptions,
): boolean {
  if (!options.requiredTargets.includes('linux-x64-gnu')) {
    return false
  }

  if (!options.targetPackage) {
    return false
  }

  if (options.targetPackage.name !== getVirtualNativePackageName('linux-x64-gnu')) {
    return false
  }

  if (!options.forceBuild && options.targetPackage.hasLocalBinary) {
    return false
  }

  return true
}

export function resolveLocalReferenceRustTargetBuildStrategy(
  options: ResolveLocalReferenceRustTargetBuildStrategyOptions,
): LocalReferenceRustTargetBuildStrategy {
  const hostPlatform = options.hostPlatform ?? process.platform
  const hostTarget = options.hostTarget ?? getVirtualNativeTriple(hostPlatform, process.arch)

  if (hostTarget && options.target === hostTarget) {
    return 'reuse-host-binary'
  }

  if (options.target === 'linux-x64-gnu') {
    return 'build-linux-with-dagger'
  }

  if (options.target === 'win32-x64-msvc') {
    return 'build-windows-cross-target'
  }

  if (
    hostPlatform === 'darwin'
    && (options.target === 'darwin-x64' || options.target === 'darwin-arm64')
  ) {
    return 'build-darwin-cross-target'
  }

  return 'unavailable'
}

export function getLocallyBuildableReferenceRustTargets(
  hostTarget: VirtualNativeTarget | null = getVirtualNativeTriple(),
  hostPlatform: NodeJS.Platform = process.platform,
): VirtualNativeTarget[] {
  return SUPPORTED_VIRTUAL_NATIVE_TARGETS.filter(
    (target) => resolveLocalReferenceRustTargetBuildStrategy({
      hostPlatform,
      hostTarget,
      target,
    }) !== 'unavailable',
  )
}

export function findMissingRequiredReferenceRustTargets(
  options: FindMissingRequiredReferenceRustTargetsOptions,
): VirtualNativeTarget[] {
  const availableTargets = new Set<VirtualNativeTarget>([
    ...options.locallyBuildableTargets,
    ...options.artifactTargets,
    ...options.cachedTarballTargets,
    ...options.publishedTargets,
  ])

  return options.requiredTargets.filter((target) => !availableTargets.has(target))
}

export function resolveReferenceRustTargetTarballStrategy(options: {
  allowRemoteFallback: boolean
  hasLocalBinary: boolean
  publishedOnNpm: boolean
  tarballExists: boolean
}): RustTargetTarballStrategy {
  if (options.hasLocalBinary) {
    return 'pack-local-binary'
  }

  if (!options.allowRemoteFallback) {
    return 'skip-target'
  }

  if (options.tarballExists) {
    return 'reuse-cached-tarball'
  }

  if (options.publishedOnNpm) {
    return 'fetch-published-tarball'
  }

  return 'skip-target'
}
