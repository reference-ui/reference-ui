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

const PACKAGE_JSON = 'package.json'
const RUST_PACKAGE_NAME = '@reference-ui/rust'

export const SUPPORTED_VIRTUAL_NATIVE_TARGETS = [
  'darwin-x64',
  'darwin-arm64',
  'linux-x64-gnu',
  'win32-x64-msvc',
] as const

export interface VirtualNativeBinding {
  rewriteCssImports: (sourceCode: string, relativePath: string) => string
  rewriteCvaImports: (sourceCode: string, relativePath: string) => string
}

let _native: VirtualNativeBinding | null | undefined = undefined

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

export function getVirtualNativeTriple(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
): (typeof SUPPORTED_VIRTUAL_NATIVE_TARGETS)[number] | null {
  if (platform === 'darwin') {
    if (arch === 'arm64') return 'darwin-arm64'
    if (arch === 'x64') return 'darwin-x64'
    return null
  }

  if (platform === 'linux') {
    if (arch === 'x64') return 'linux-x64-gnu'
    return null
  }

  if (platform === 'win32') {
    if (arch === 'x64') return 'win32-x64-msvc'
    return null
  }

  return null
}

export function getVirtualNativeCandidates(packageDir: string, triple: string): string[] {
  return [
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

  return getVirtualNativeCandidates(packageDir, triple).find((path) => fileExists(path)) ?? null
}

export function loadVirtualNative(): VirtualNativeBinding | null {
  if (_native !== undefined) return _native

  try {
    const packageDir = resolveReferenceRsPackageDir()
    const nodePath = resolveVirtualNativeBinaryPath(packageDir)
    if (!nodePath) {
      _native = null
      return null
    }

    const require = createRequire(import.meta.url)
    const binding = require(nodePath) as VirtualNativeBinding
    _native = binding
    return binding
  } catch {
    _native = null
    return null
  }
}

export function getVirtualNative(): VirtualNativeBinding | null {
  return loadVirtualNative()
}
