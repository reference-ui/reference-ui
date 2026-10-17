/**
 * Builds the consumer-facing message shown when the native addon cannot be used.
 * Takes the feature label and one loader diagnostics snapshot, and emits a single space-joined sentence sequence.
 * Each load status contributes its own sentences; contributor guidance appears only for monorepo checkouts.
 */
import type { ReferenceNativeDiagnostics } from './loader.js'
import { SUPPORTED_REFERENCE_NATIVE_TARGETS } from './shared/targets.js'

export function buildUnavailableMessage(
  feature: string,
  diagnostics: ReferenceNativeDiagnostics
): string {
  return [
    `Reference UI could not load the native addon required to ${feature}.`,
    'Prebuilt binaries for @reference-ui/rust should install automatically during dependency installation.',
    ...describeLoadStatus(diagnostics),
    `Supported targets: ${SUPPORTED_REFERENCE_NATIVE_TARGETS.join(', ')}.`,
    ...describeContributorHint(diagnostics.packageDir),
  ].join(' ')
}

/** Sentences for the load status: why the addon is unusable, and where the loader looked. */
function describeLoadStatus(diagnostics: ReferenceNativeDiagnostics): string[] {
  switch (diagnostics.status) {
    case 'unsupported-platform':
      return [
        `This platform is not currently supported (${diagnostics.platform} ${diagnostics.arch}).`,
      ]
    case 'binary-not-found':
      return describeMissingBinary(diagnostics)
    case 'package-dir-not-found':
      return [
        'The installed @reference-ui/rust package could not be resolved. Reinstall dependencies.',
      ]
    case 'load-failed':
      return [describeLoadFailure(diagnostics.cause)]
    case 'loaded':
      return []
  }
}

function describeMissingBinary(diagnostics: ReferenceNativeDiagnostics): string[] {
  const sentences: string[] = []
  if (diagnostics.targetPackageName) {
    sentences.push(`Expected optional target package: ${diagnostics.targetPackageName}.`)
  }
  sentences.push(...describeTargetPackageLocation(diagnostics))
  sentences.push(
    `No native binary was found for ${diagnostics.platform} ${diagnostics.arch}. Reinstall dependencies so your package manager can fetch the correct prebuilt binary.`
  )
  if (diagnostics.candidatePaths.length > 0) {
    sentences.push(`Searched paths: ${diagnostics.candidatePaths.join(', ')}.`)
  }
  return sentences
}

/** Where the platform package resolved, or that it was missing; empty when no target package was named. */
function describeTargetPackageLocation(diagnostics: ReferenceNativeDiagnostics): string[] {
  if (diagnostics.targetPackageDir) {
    return [
      `The platform package resolved to ${diagnostics.targetPackageDir}, but no native binary was present there or in the root @reference-ui/rust package.`,
    ]
  }
  if (diagnostics.targetPackageName) {
    return [
      `The platform package ${diagnostics.targetPackageName} was not installed alongside @reference-ui/rust.`,
    ]
  }
  return []
}

function describeLoadFailure(cause: string | null): string {
  return cause
    ? `A native binary was found but failed to load: ${cause}. Reinstall dependencies and verify your Node runtime can load native addons on this platform.`
    : 'A native binary was found but failed to load. Reinstall dependencies and verify your Node runtime can load native addons on this platform.'
}

function describeContributorHint(packageDir: string | null): string[] {
  if (!isContributorCheckout(packageDir)) return []
  return [
    'If you are contributing inside the Reference UI monorepo, run `pnpm --filter @reference-ui/rust run build`.',
  ]
}

function isContributorCheckout(packageDir: string | null): boolean {
  return packageDir !== null && !packageDir.split(/[\\/]/).includes('node_modules')
}
