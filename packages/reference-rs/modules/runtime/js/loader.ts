/**
 * Load the Rust native addon for Reference UI.
 * Resolves the platform-specific .node binary and validates its export contract.
 *
 * Falls back to null if the native addon is unavailable (e.g. wrong platform,
 * not built, or load error). Callers should use JS fallback when native is null.
 * REFERENCE_UI_NATIVE_PATH overrides the candidate with one explicit file so
 * instrument builds (e.g. `pnpm agentrs alloc`) can load without touching dist.
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getReferenceNativePackageName,
  getReferenceNativeTriple,
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
  type ReferenceNativeTarget,
} from './shared/targets.js'
import { REQUIRED_REFERENCE_NATIVE_EXPORTS } from './shared/native-contract.js'

const PACKAGE_JSON = 'package.json'
const RUST_PACKAGE_NAME = '@reference-ui/rust'
const NATIVE_PATH_ENV = 'REFERENCE_UI_NATIVE_PATH'
type RequireFn = ReturnType<typeof createRequire>

export { getReferenceNativeTriple, SUPPORTED_REFERENCE_NATIVE_TARGETS }

export interface ReferenceNativeBinding {
  getNativeCapabilities: () => string
  [key: string]: unknown
}

export interface ReferenceNativeDiagnostics {
  status:
    | 'loaded'
    | 'unsupported-platform'
    | 'binary-not-found'
    | 'load-failed'
    | 'package-dir-not-found'
  packageDir: string | null
  platform: NodeJS.Platform
  arch: string
  triple: string | null
  targetPackageDir: string | null
  targetPackageName: string | null
  candidatePaths: string[]
  cause: string | null
}

let _native: ReferenceNativeBinding | null | undefined = undefined
let _diagnostics: ReferenceNativeDiagnostics | undefined = undefined

export function getReferenceNativeCompatibilityError(
  binding: Record<string, unknown>
): string | null {
  const missingExports = REQUIRED_REFERENCE_NATIVE_EXPORTS.filter(
    (name: string) => typeof binding[name] !== 'function'
  )

  if (missingExports.length > 0) {
    return `missing required native export(s): ${missingExports.join(', ')}`
  }

  let capabilities: unknown
  try {
    capabilities = JSON.parse((binding.getNativeCapabilities as () => string)())
  } catch (error) {
    return `failed to read native capabilities: ${error instanceof Error ? error.message : String(error)}`
  }

  if (capabilities === null || typeof capabilities !== 'object') {
    return 'native binary returned malformed capabilities metadata'
  }

  if ((capabilities as Record<string, unknown>).schema !== 1) {
    return 'native binary returned incompatible capabilities schema'
  }

  return null
}

function isContributorCheckout(packageDir: string | null): boolean {
  return packageDir !== null && !packageDir.split(/[\\/]/).includes('node_modules')
}

function getDefaultRequire(): RequireFn {
  return createRequire(import.meta.url)
}

function setDiagnostics(diagnostics: ReferenceNativeDiagnostics): void {
  _diagnostics = diagnostics
}

function formatSupportedTargets(): string {
  return SUPPORTED_REFERENCE_NATIVE_TARGETS.join(', ')
}

export function resolveReferenceRsPackageDir(fromUrl: string = import.meta.url): string {
  let dir = dirname(fileURLToPath(fromUrl))
  const root = parse(dir).root

  while (dir !== root) {
    const packageJsonPath = resolve(dir, PACKAGE_JSON)
    if (existsSync(packageJsonPath)) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { name?: string }
      if (pkg.name === RUST_PACKAGE_NAME) return dir
    }
    dir = dirname(dir)
  }

  throw new Error('@reference-ui/rust package directory could not be resolved.')
}

export function getReferenceNativeCandidates(packageDir: string, triple: string): string[] {
  const override = process.env[NATIVE_PATH_ENV]
  if (override && override.length > 0) return [override]
  return [join(packageDir, 'dist', 'native', `reference-native.${triple}.node`)]
}

function resolveOptionalTargetPackageDir(
  triple: ReferenceNativeTarget,
  requireImpl: RequireFn = getDefaultRequire()
): string | null {
  try {
    const packageJsonPath = requireImpl.resolve(
      `${getReferenceNativePackageName(triple)}/package.json`
    )
    return dirname(packageJsonPath)
  } catch {
    return null
  }
}

function getReferenceNativeCandidatePaths(
  packageDir: string,
  triple: ReferenceNativeTarget,
  requireImpl: RequireFn = getDefaultRequire()
): string[] {
  const candidates = getReferenceNativeCandidates(packageDir, triple)
  const optionalTargetPackageDir = resolveOptionalTargetPackageDir(triple, requireImpl)

  if (optionalTargetPackageDir && optionalTargetPackageDir !== packageDir) {
    candidates.push(join(optionalTargetPackageDir, `reference-native.${triple}.node`))
  }

  return candidates
}

export function resolveReferenceNativeBinaryPath(
  packageDir: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  fileExists: (path: string) => boolean = existsSync,
  requireImpl: RequireFn = getDefaultRequire()
): string | null {
  const triple = getReferenceNativeTriple(platform, arch)
  if (!triple) return null

  return (
    getReferenceNativeCandidatePaths(packageDir, triple, requireImpl).find(path =>
      fileExists(path)
    ) ?? null
  )
}

export function loadReferenceNative(): ReferenceNativeBinding | null {
  if (_native !== undefined) return _native

  const platform = process.platform
  const arch = process.arch
  const triple = getReferenceNativeTriple(platform, arch)

  try {
    const requireImpl = getDefaultRequire()
    const packageDir = resolveReferenceRsPackageDir()
    if (!triple) {
      setDiagnostics({
        status: 'unsupported-platform',
        packageDir,
        platform,
        arch,
        triple,
        targetPackageDir: null,
        targetPackageName: null,
        candidatePaths: [],
        cause: null,
      })
      _native = null
      return null
    }

    const targetPackageDir = resolveOptionalTargetPackageDir(triple, requireImpl)
    const targetPackageName = getReferenceNativePackageName(triple)
    const candidatePaths = getReferenceNativeCandidatePaths(packageDir, triple, requireImpl)
    const nodePath = candidatePaths.find(path => existsSync(path)) ?? null
    if (!nodePath) {
      setDiagnostics({
        status: 'binary-not-found',
        packageDir,
        platform,
        arch,
        triple,
        targetPackageDir,
        targetPackageName,
        candidatePaths,
        cause: null,
      })
      _native = null
      return null
    }

    const binding = requireImpl(nodePath) as Record<string, unknown>
    const compatibilityError = getReferenceNativeCompatibilityError(binding)
    if (compatibilityError) {
      setDiagnostics({
        status: 'load-failed',
        packageDir,
        platform,
        arch,
        triple,
        targetPackageDir,
        targetPackageName,
        candidatePaths: [nodePath],
        cause: `Incompatible native binary at ${nodePath}: ${compatibilityError}`,
      })
      _native = null
      return null
    }

    setDiagnostics({
      status: 'loaded',
      packageDir,
      platform,
      arch,
      triple,
      targetPackageDir,
      targetPackageName,
      candidatePaths: [nodePath],
      cause: null,
    })
    _native = binding as unknown as ReferenceNativeBinding
    return _native
  } catch (error) {
    setDiagnostics({
      status:
        error instanceof Error &&
        error.message.includes('package directory could not be resolved')
          ? 'package-dir-not-found'
          : 'load-failed',
      packageDir: null,
      platform,
      arch,
      triple,
      targetPackageDir: null,
      targetPackageName: triple ? getReferenceNativePackageName(triple) : null,
      candidatePaths: [],
      cause: error instanceof Error ? error.message : String(error),
    })
    _native = null
    return null
  }
}

export function getReferenceNative(): ReferenceNativeBinding | null {
  return loadReferenceNative()
}

export function getReferenceNativeDiagnostics(): ReferenceNativeDiagnostics {
  if (_diagnostics) return _diagnostics
  loadReferenceNative()

  return (
    _diagnostics ?? {
      status: 'load-failed',
      packageDir: null,
      platform: process.platform,
      arch: process.arch,
      triple: getReferenceNativeTriple(process.platform, process.arch),
      targetPackageDir: null,
      targetPackageName: null,
      candidatePaths: [],
      cause: null,
    }
  )
}

export function getReferenceNativeUnavailableMessage(feature: string): string {
  const diagnostics = getReferenceNativeDiagnostics()
  const messageParts = [
    `Reference UI could not load the native addon required to ${feature}.`,
    'Prebuilt binaries for @reference-ui/rust should install automatically during dependency installation.',
  ]

  switch (diagnostics.status) {
    case 'unsupported-platform':
      messageParts.push(
        `This platform is not currently supported (${diagnostics.platform} ${diagnostics.arch}).`
      )
      break
    case 'binary-not-found':
      if (diagnostics.targetPackageName) {
        messageParts.push(
          `Expected optional target package: ${diagnostics.targetPackageName}.`
        )
      }
      if (diagnostics.targetPackageDir) {
        messageParts.push(
          `The platform package resolved to ${diagnostics.targetPackageDir}, but no native binary was present there or in the root @reference-ui/rust package.`
        )
      } else if (diagnostics.targetPackageName) {
        messageParts.push(
          `The platform package ${diagnostics.targetPackageName} was not installed alongside @reference-ui/rust.`
        )
      }
      messageParts.push(
        `No native binary was found for ${diagnostics.platform} ${diagnostics.arch}. Reinstall dependencies so your package manager can fetch the correct prebuilt binary.`
      )
      if (diagnostics.candidatePaths.length > 0) {
        messageParts.push(`Searched paths: ${diagnostics.candidatePaths.join(', ')}.`)
      }
      break
    case 'package-dir-not-found':
      messageParts.push(
        'The installed @reference-ui/rust package could not be resolved. Reinstall dependencies.'
      )
      break
    case 'load-failed':
      messageParts.push(
        diagnostics.cause
          ? `A native binary was found but failed to load: ${diagnostics.cause}. Reinstall dependencies and verify your Node runtime can load native addons on this platform.`
          : 'A native binary was found but failed to load. Reinstall dependencies and verify your Node runtime can load native addons on this platform.'
      )
      break
    case 'loaded':
      break
  }

  messageParts.push(`Supported targets: ${formatSupportedTargets()}.`)

  if (isContributorCheckout(diagnostics.packageDir)) {
    messageParts.push(
      'If you are contributing inside the Reference UI monorepo, run `pnpm --filter @reference-ui/rust run build`.'
    )
  }

  return messageParts.join(' ')
}
