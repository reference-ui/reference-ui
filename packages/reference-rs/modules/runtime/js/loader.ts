/**
 * Load the Rust native addon for Reference UI.
 * Resolves the platform-specific .node binary and validates its export contract.
 *
 * Returns null if the native addon is unavailable (e.g. wrong platform,
 * not built, or load error); native.ts throws a clear error in that case.
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
import { buildUnavailableMessage } from './unavailable-message.js'

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

function getDefaultRequire(): RequireFn {
  return createRequire(import.meta.url)
}

function setDiagnostics(diagnostics: ReferenceNativeDiagnostics): void {
  _diagnostics = diagnostics
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

/** Platform facts captured once per load; `triple` is null on hosts without a prebuilt binary. */
interface PlatformFacts {
  platform: NodeJS.Platform
  arch: string
  triple: ReferenceNativeTarget | null
}

type TargetFields = Pick<
  ReferenceNativeDiagnostics,
  'targetPackageDir' | 'targetPackageName' | 'candidatePaths'
>

type AttemptFields = TargetFields & Pick<ReferenceNativeDiagnostics, 'status' | 'cause'>

export function loadReferenceNative(): ReferenceNativeBinding | null {
  if (_native !== undefined) return _native

  const platform = process.platform
  const arch = process.arch
  const triple = getReferenceNativeTriple(platform, arch)
  const facts: PlatformFacts = { platform, arch, triple }

  try {
    return loadForPlatform(facts)
  } catch (error) {
    return settleLoad(exceptionDiagnostics(facts, error), null)
  }
}

function loadForPlatform(facts: PlatformFacts): ReferenceNativeBinding | null {
  const requireImpl = getDefaultRequire()
  const packageDir = resolveReferenceRsPackageDir()
  const { triple } = facts
  if (!triple) {
    return settleLoad(
      diagnosticsFor(facts, packageDir, {
        status: 'unsupported-platform',
        targetPackageDir: null,
        targetPackageName: null,
        candidatePaths: [],
        cause: null,
      }),
      null
    )
  }

  const { targets, nodePath } = locateBinary(packageDir, triple, requireImpl)
  if (!nodePath) {
    return settleLoad(
      diagnosticsFor(facts, packageDir, { ...targets, status: 'binary-not-found', cause: null }),
      null
    )
  }

  const binding = requireImpl(nodePath) as Record<string, unknown>
  const compatibilityError = getReferenceNativeCompatibilityError(binding)
  if (compatibilityError) {
    return settleLoad(
      diagnosticsFor(facts, packageDir, {
        ...targets,
        status: 'load-failed',
        candidatePaths: [nodePath],
        cause: `Incompatible native binary at ${nodePath}: ${compatibilityError}`,
      }),
      null
    )
  }

  return settleLoad(
    diagnosticsFor(facts, packageDir, {
      ...targets,
      status: 'loaded',
      candidatePaths: [nodePath],
      cause: null,
    }),
    binding as unknown as ReferenceNativeBinding
  )
}

/** Resolves the platform package and candidate paths for one supported triple, and the first path that exists. */
function locateBinary(
  packageDir: string,
  triple: ReferenceNativeTarget,
  requireImpl: RequireFn
): { targets: TargetFields; nodePath: string | null } {
  const targets: TargetFields = {
    targetPackageDir: resolveOptionalTargetPackageDir(triple, requireImpl),
    targetPackageName: getReferenceNativePackageName(triple),
    candidatePaths: getReferenceNativeCandidatePaths(packageDir, triple, requireImpl),
  }
  const nodePath = targets.candidatePaths.find(path => existsSync(path)) ?? null
  return { targets, nodePath }
}

/** Snapshot for a load that threw before recording its own outcome; such loads report no package dir. */
function exceptionDiagnostics(facts: PlatformFacts, error: unknown): ReferenceNativeDiagnostics {
  const packageDirMissing =
    error instanceof Error && error.message.includes('package directory could not be resolved')
  return diagnosticsFor(facts, null, {
    status: packageDirMissing ? 'package-dir-not-found' : 'load-failed',
    targetPackageDir: null,
    targetPackageName: facts.triple ? getReferenceNativePackageName(facts.triple) : null,
    candidatePaths: [],
    cause: error instanceof Error ? error.message : String(error),
  })
}

function diagnosticsFor(
  facts: PlatformFacts,
  packageDir: string | null,
  fields: AttemptFields
): ReferenceNativeDiagnostics {
  return {
    status: fields.status,
    packageDir,
    platform: facts.platform,
    arch: facts.arch,
    triple: facts.triple,
    targetPackageDir: fields.targetPackageDir,
    targetPackageName: fields.targetPackageName,
    candidatePaths: fields.candidatePaths,
    cause: fields.cause,
  }
}

/** Publishes one attempt's diagnostics and caches its result, so later loads return it without retrying. */
function settleLoad(
  diagnostics: ReferenceNativeDiagnostics,
  binding: ReferenceNativeBinding | null
): ReferenceNativeBinding | null {
  setDiagnostics(diagnostics)
  _native = binding
  return binding
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
  return buildUnavailableMessage(feature, getReferenceNativeDiagnostics())
}
