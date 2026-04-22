/**
 * Load the Rust native addon for virtual transforms.
 * Provides rewriteCssImports and rewriteCvaImports via NAPI.
 *
 * Falls back to undefined if the native addon is unavailable (e.g. wrong platform,
 * not built, or load error). Callers should use JS fallback when native is null.
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getVirtualNativeTriple,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
} from '../shared/targets'

const PACKAGE_JSON = 'package.json'
const RUST_PACKAGE_NAME = '@reference-ui/rust'

export { getVirtualNativeTriple, SUPPORTED_VIRTUAL_NATIVE_TARGETS }

export interface VirtualNativeBinding {
  rewriteCssImports: (sourceCode: string, relativePath: string) => string
  rewriteCvaImports: (sourceCode: string, relativePath: string) => string
  scanAndEmitModules: (rootDir: string, include: string[]) => string
  analyzeAtlas: (rootDir: string, configJson?: string) => string
  analyzeStyletrace: (rootDir: string) => string
}

export interface VirtualNativeDiagnostics {
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
  candidatePaths: string[]
  cause: string | null
}

let _native: VirtualNativeBinding | null | undefined = undefined
let _diagnostics: VirtualNativeDiagnostics | undefined = undefined

function isContributorCheckout(packageDir: string | null): boolean {
  return packageDir !== null && !packageDir.split(/[\\/]/).includes('node_modules')
}

function setDiagnostics(diagnostics: VirtualNativeDiagnostics): VirtualNativeDiagnostics {
  _diagnostics = diagnostics
  return diagnostics
}

function formatSupportedTargets(): string {
  return SUPPORTED_VIRTUAL_NATIVE_TARGETS.join(', ')
}

export function resolveReferenceRsPackageDir(fromUrl: string = import.meta.url): string {
  let dir = dirname(fileURLToPath(fromUrl))
  const root = parse(dir).root

  while (dir !== root) {
    const packageJsonPath = resolve(dir, PACKAGE_JSON)
    if (existsSync(packageJsonPath)) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      if (pkg.name === RUST_PACKAGE_NAME) return dir
    }
    dir = dirname(dir)
  }

  throw new Error('@reference-ui/rust package directory could not be resolved.')
}

export function getVirtualNativeCandidates(packageDir: string, triple: string): string[] {
  return [
    join(packageDir, 'native', `virtual-native.${triple}.node`),
    join(packageDir, `virtual-native.${triple}.node`),
    join(packageDir, 'dist', `virtual-native.${triple}.node`),
  ]
}

export function resolveVirtualNativeBinaryPath(
  packageDir: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  fileExists: (path: string) => boolean = existsSync
): string | null {
  const triple = getVirtualNativeTriple(platform, arch)
  if (!triple) return null

  return (
    getVirtualNativeCandidates(packageDir, triple).find(path => fileExists(path)) ?? null
  )
}

export function loadVirtualNative(): VirtualNativeBinding | null {
  if (_native !== undefined) return _native

  const platform = process.platform
  const arch = process.arch
  const triple = getVirtualNativeTriple(platform, arch)

  try {
    const packageDir = resolveReferenceRsPackageDir()
    const candidatePaths = triple ? getVirtualNativeCandidates(packageDir, triple) : []
    if (!triple) {
      setDiagnostics({
        status: 'unsupported-platform',
        packageDir,
        platform,
        arch,
        triple,
        candidatePaths,
        cause: null,
      })
      _native = null
      return null
    }

    const nodePath = candidatePaths.find(path => existsSync(path)) ?? null
    if (!nodePath) {
      setDiagnostics({
        status: 'binary-not-found',
        packageDir,
        platform,
        arch,
        triple,
        candidatePaths,
        cause: null,
      })
      _native = null
      return null
    }

    const require = createRequire(import.meta.url)
    const binding = require(nodePath) as VirtualNativeBinding
    setDiagnostics({
      status: 'loaded',
      packageDir,
      platform,
      arch,
      triple,
      candidatePaths: [nodePath],
      cause: null,
    })
    _native = binding
    return binding
  } catch (error) {
    setDiagnostics({
      status: error instanceof Error && error.message.includes('package directory could not be resolved')
        ? 'package-dir-not-found'
        : 'load-failed',
      packageDir: null,
      platform,
      arch,
      triple,
      candidatePaths: [],
      cause: error instanceof Error ? error.message : String(error),
    })
    _native = null
    return null
  }
}

export function getVirtualNative(): VirtualNativeBinding | null {
  return loadVirtualNative()
}

export function getVirtualNativeDiagnostics(): VirtualNativeDiagnostics {
  if (_diagnostics) return _diagnostics
  loadVirtualNative()

  return (
    _diagnostics ?? {
      status: 'load-failed',
      packageDir: null,
      platform: process.platform,
      arch: process.arch,
      triple: getVirtualNativeTriple(process.platform, process.arch),
      candidatePaths: [],
      cause: null,
    }
  )
}

export function getVirtualNativeUnavailableMessage(feature: string): string {
  const diagnostics = getVirtualNativeDiagnostics()
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
      messageParts.push(
        `No native binary was found for ${diagnostics.platform} ${diagnostics.arch}. Reinstall dependencies so your package manager can fetch the correct prebuilt binary.`
      )
      break
    case 'package-dir-not-found':
      messageParts.push('The installed @reference-ui/rust package could not be resolved. Reinstall dependencies.')
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
