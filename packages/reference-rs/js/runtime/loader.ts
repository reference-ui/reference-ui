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

import { getVirtualNativeTriple, SUPPORTED_VIRTUAL_NATIVE_TARGETS } from '../shared/targets'

const PACKAGE_JSON = 'package.json'
const RUST_PACKAGE_NAME = '@reference-ui/rust'

export { getVirtualNativeTriple, SUPPORTED_VIRTUAL_NATIVE_TARGETS }

export interface VirtualNativeBinding {
  rewriteCssImports: (sourceCode: string, relativePath: string) => string
  rewriteCvaImports: (sourceCode: string, relativePath: string) => string
  scanAndEmitBundle: (rootDir: string, include: string[]) => string
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
