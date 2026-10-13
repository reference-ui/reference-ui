/**
 * Rust target planning helpers.
 *
 * This module owns the pure decision logic for local target build strategies,
 * missing-target detection, native binary freshness, and tarball reuse strategy
 * selection. A binary is fresh only when its inputs stamp matches the current
 * Rust sources; export names alone do not prove freshness.
 */

import {
  getReferenceNativeTriple,
  getReferenceNativePackageName,
  getRustTarget,
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
  type ReferenceNativeTarget,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/targets.js'

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
  requiredTargets: readonly ReferenceNativeTarget[]
  targetPackage: Pick<{ hasLocalBinary: boolean; name: string }, 'hasLocalBinary' | 'name'> | undefined
}

export interface FindMissingRequiredReferenceRustTargetsOptions {
  artifactTargets: readonly ReferenceNativeTarget[]
  cachedTarballTargets: readonly ReferenceNativeTarget[]
  locallyBuildableTargets: readonly ReferenceNativeTarget[]
  publishedTargets: readonly ReferenceNativeTarget[]
  requiredTargets: readonly ReferenceNativeTarget[]
}

export interface ResolveLocalReferenceRustTargetBuildStrategyOptions {
  hostPlatform?: NodeJS.Platform
  hostTarget?: ReferenceNativeTarget | null
  target: ReferenceNativeTarget
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

  if (options.targetPackage.name !== getReferenceNativePackageName('linux-x64-gnu')) {
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
  const hostTarget = options.hostTarget ?? getReferenceNativeTriple(hostPlatform, process.arch)

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
  hostTarget: ReferenceNativeTarget | null = getReferenceNativeTriple(),
  hostPlatform: NodeJS.Platform = process.platform,
): ReferenceNativeTarget[] {
  return SUPPORTED_REFERENCE_NATIVE_TARGETS.filter(
    (target) => resolveLocalReferenceRustTargetBuildStrategy({
      hostPlatform,
      hostTarget,
      target,
    }) !== 'unavailable',
  )
}

export function findMissingRequiredReferenceRustTargets(
  options: FindMissingRequiredReferenceRustTargetsOptions,
): ReferenceNativeTarget[] {
  const availableTargets = new Set<ReferenceNativeTarget>([
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

/**
 * `fresh`: binary present, inputs stamp matches the current Rust sources, and
 * the binary passes the native contract check. `stale`: present but unstamped,
 * stamped for other sources, or failing the contract. `missing`: absent.
 */
export type ReferenceRustBinaryState = 'fresh' | 'stale' | 'missing'

/**
 * How much this run needs a target:
 * - `hard`: named in an explicit target list, or a release. A stale or missing
 *   binary this host cannot build is refused.
 * - `soft`: the implicit all-target default (no explicit list, not a release).
 *   Such a target is never refused; one this host cannot build is left out with
 *   a warning.
 * - `none`: an explicit list that does not name the target. A stale one is left
 *   out with a warning.
 */
export type ReferenceRustTargetRequirement = 'hard' | 'soft' | 'none'

export type ReferenceRustTargetFreshnessAction =
  | 'use-local-binary'
  | 'rebuild-here'
  | 'fail-unbuildable'
  | 'skip-stale'
  | 'fallback'

/**
 * A host builds its own triple natively, and linux builds in Dagger. Any other
 * target would need a cross-build, which the pipeline does not attempt.
 */
export function canBuildReferenceRustTargetHere(
  target: ReferenceNativeTarget,
  hostTarget: ReferenceNativeTarget | null,
): boolean {
  return target === hostTarget || target === 'linux-x64-gnu'
}

/** The targets this host can produce without a cross-build: its own triple and linux. */
export function getNativelyBuildableReferenceRustTargets(
  hostTarget: ReferenceNativeTarget | null = getReferenceNativeTriple(),
): ReferenceNativeTarget[] {
  return SUPPORTED_REFERENCE_NATIVE_TARGETS.filter(target => canBuildReferenceRustTargetHere(target, hostTarget))
}

/**
 * `requiredTargets` is the caller's explicit list, or undefined for the implicit
 * all-target default. A release is always hard for every target.
 */
export function resolveReferenceRustTargetRequirement(options: {
  forceBuild: boolean
  requiredTargets?: readonly ReferenceNativeTarget[]
  target: ReferenceNativeTarget
}): ReferenceRustTargetRequirement {
  if (options.requiredTargets === undefined) {
    return options.forceBuild ? 'hard' : 'soft'
  }

  return options.requiredTargets.includes(options.target) ? 'hard' : 'none'
}

/**
 * Decides what packing does with one target package. A stale binary is never
 * packed. A target this host can build is rebuilt when it is needed. A target it
 * cannot build is refused only when hard, and otherwise left out. A missing target
 * is refused only when hard and forced (release); otherwise the cached or
 * published tarball decides, and the caller reports a miss.
 */
export function resolveReferenceRustTargetFreshnessAction(options: {
  buildableHere: boolean
  forceBuild: boolean
  requirement: ReferenceRustTargetRequirement
  state: ReferenceRustBinaryState
}): ReferenceRustTargetFreshnessAction {
  if (options.state === 'fresh') {
    return 'use-local-binary'
  }

  if (options.requirement === 'none') {
    return options.state === 'stale' ? 'skip-stale' : 'fallback'
  }

  if (options.buildableHere) {
    return 'rebuild-here'
  }

  if (options.state === 'stale') {
    return options.requirement === 'hard' ? 'fail-unbuildable' : 'skip-stale'
  }

  return options.requirement === 'hard' && options.forceBuild ? 'fail-unbuildable' : 'fallback'
}

/**
 * Pack only picks up a binary this host cannot build from dist/artifacts, with
 * its stamp beside it (the layout of a CI artifact download), so the steps end there.
 */
function formatRefreshSteps(target: ReferenceNativeTarget): string {
  return [
    `build ${target} from these sources on a matching host and run \`pnpm --dir packages/reference-rs run write-native-stamp -- ${target}\` there,`,
    `then copy reference-native.${target}.node and reference-native.${target}.inputs.sha256 from its dist/native`,
    `into packages/reference-rs/dist/artifacts/bindings-${getRustTarget(target)}/ on this machine`,
  ].join(' ')
}

export interface UnbuildableReferenceRustTarget {
  forceBuild: boolean
  hostTarget: ReferenceNativeTarget | null
  packageName: string
  packageVersion: string
  state: ReferenceRustBinaryState
  target: ReferenceNativeTarget
}

export function formatUnbuildableReferenceRustTargetsError(
  inputsHash: string,
  entries: readonly UnbuildableReferenceRustTarget[],
): string {
  const lines = entries.map((entry) => {
    const reason = entry.forceBuild && entry.state !== 'stale'
      ? 'is required for a release and has no local binary'
      : 'is stale or unstamped (its inputs stamp does not match the current packages/reference-rs sources)'

    return [
      `  - ${entry.packageName}@${entry.packageVersion}: the ${entry.target} binary ${reason}; this host (${entry.hostTarget ?? 'unknown'}) cannot build ${entry.target}.`,
      `    To refresh it: ${formatRefreshSteps(entry.target)}.`,
    ].join('\n')
  })

  return [
    `Refusing to pack @reference-ui/rust: native targets this pack requires cannot be refreshed on this host (sources ${inputsHash.slice(0, 12)}…).`,
    ...lines,
    'Nothing stale was packed. Re-run from a host that can build every required target, or drop the target from the explicit list.',
  ].join('\n')
}

/**
 * A target left out of a pack. The line names the stamp command that brings it
 * back, so the warning is actionable without reading the source.
 */
export function formatLeftOutReferenceRustTargetWarning(entry: {
  buildableHere: boolean
  hostTarget: ReferenceNativeTarget | null
  packageName: string
  packageVersion: string
  state: Exclude<ReferenceRustBinaryState, 'fresh'>
  target: ReferenceNativeTarget
}): string {
  const binary = entry.state === 'missing' ? 'is missing' : 'is stale or unstamped'
  const reason = entry.buildableHere
    ? `and this run does not name ${entry.target}`
    : `and this host (${entry.hostTarget ?? 'unknown'}) cannot build ${entry.target}`
  const fallback = entry.state === 'missing' ? ', and no cached or published tarball is available' : ''

  const remedy = entry.buildableHere
    ? `To include it, name ${entry.target} in the target list so this host rebuilds it.`
    : `To include it, ${formatRefreshSteps(entry.target)}.`

  return [
    `Leaving ${entry.packageName}@${entry.packageVersion} out of this pack: its ${entry.target} binary ${binary} ${reason}${fallback}.`,
    remedy,
  ].join(' ')
}
