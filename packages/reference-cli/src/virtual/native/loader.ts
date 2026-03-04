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
import { resolveCliPackageDir } from '../../lib/paths'

const platformMap: Record<string, string> = {
  darwin: process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64',
  linux: process.arch === 'arm64' ? 'linux-arm64-gnu' : 'linux-x64-gnu',
  win32: 'win32-x64-msvc',
}

export interface VirtualNativeBinding {
  rewriteCssImports: (sourceCode: string, relativePath: string) => string
  rewriteCvaImports: (sourceCode: string, relativePath: string) => string
}

let _native: VirtualNativeBinding | null | undefined = undefined

export function loadVirtualNative(): VirtualNativeBinding | null {
  if (_native !== undefined) return _native

  try {
    const triple = platformMap[process.platform]
    if (!triple) {
      _native = null
      return null
    }

    const cliDir = resolveCliPackageDir()
    const candidates = [
      join(cliDir, 'src/virtual/native', `virtual-native.${triple}.node`),
      join(cliDir, 'dist/cli/virtual/native', `virtual-native.${triple}.node`),
    ]
    const nodePath = candidates.find((p) => existsSync(p))
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
