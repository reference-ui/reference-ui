/**
 * Load the Rust native addon for virtual transforms.
 * Provides rewrite_css_imports and rewrite_cva_imports via NAPI.
 *
 * Falls back to undefined if the native addon is unavailable (e.g. wrong platform,
 * not built, or load error). Callers should use JS fallback when native is null.
 */
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { resolveCorePackageDir } from '../../lib/paths'

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

export function getVirtualNativeCandidates(coreDir: string, triple: string): string[] {
  return [
    join(coreDir, 'src/virtual/native', `virtual-native.${triple}.node`),
    join(coreDir, 'dist/cli/virtual/native', `virtual-native.${triple}.node`),
  ]
}

export function resolveVirtualNativeBinaryPath(
  coreDir: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  fileExists: (path: string) => boolean = existsSync
): string | null {
  const triple = getVirtualNativeTriple(platform, arch)
  if (!triple) return null

  return getVirtualNativeCandidates(coreDir, triple).find((path) => fileExists(path)) ?? null
}

export function loadVirtualNative(): VirtualNativeBinding | null {
  if (_native !== undefined) return _native

  try {
    const cliDir = resolveCorePackageDir()
    const nodePath = resolveVirtualNativeBinaryPath(cliDir)
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
