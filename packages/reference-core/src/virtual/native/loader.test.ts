import { afterEach, describe, expect, it, vi } from 'vitest'

async function importLoaderModule() {
  vi.resetModules()

  const existsSync = vi.fn(() => false)
  const resolveCorePackageDir = vi.fn(() => '/workspace/core')
  const requireBinding = vi.fn(() => ({
    rewriteCssImports: vi.fn(),
    rewriteCvaImports: vi.fn(),
  }))
  const createRequire = vi.fn(() => requireBinding)

  vi.doMock('node:fs', () => ({
    existsSync,
  }))
  vi.doMock('node:module', () => ({
    createRequire,
  }))
  vi.doMock('../../lib/paths', () => ({
    resolveCorePackageDir,
  }))

  const mod = await import('./loader')
  return { ...mod, existsSync, resolveCorePackageDir, createRequire, requireBinding }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.doUnmock('node:module')
  vi.doUnmock('../../lib/paths')
  vi.restoreAllMocks()
})

describe('virtual/native/loader', () => {
  it('maps only supported platform and architecture combinations', async () => {
    const { getVirtualNativeTriple } = await importLoaderModule()

    expect(getVirtualNativeTriple('darwin', 'x64')).toBe('darwin-x64')
    expect(getVirtualNativeTriple('darwin', 'arm64')).toBe('darwin-arm64')
    expect(getVirtualNativeTriple('linux', 'x64')).toBe('linux-x64-gnu')
    expect(getVirtualNativeTriple('linux', 'arm64')).toBeNull()
    expect(getVirtualNativeTriple('win32', 'x64')).toBe('win32-x64-msvc')
    expect(getVirtualNativeTriple('win32', 'arm64')).toBeNull()
  })

  it('builds source and dist candidate paths for a target triple', async () => {
    const { getVirtualNativeCandidates } = await importLoaderModule()

    expect(getVirtualNativeCandidates('/workspace/core', 'darwin-arm64')).toEqual([
      '/workspace/core/src/virtual/native/virtual-native.darwin-arm64.node',
      '/workspace/core/dist/cli/virtual/native/virtual-native.darwin-arm64.node',
    ])
  })

  it('returns null when no binary exists for a supported target', async () => {
    const { resolveVirtualNativeBinaryPath, existsSync } = await importLoaderModule()

    expect(resolveVirtualNativeBinaryPath('/workspace/core', 'linux', 'x64')).toBeNull()
    expect(existsSync).toHaveBeenCalledTimes(2)
  })

  it('prefers the first existing candidate when resolving a binary path', async () => {
    const { resolveVirtualNativeBinaryPath } = await importLoaderModule()
    const fileExists = vi.fn((path: string) => {
      return path === '/workspace/core/src/virtual/native/virtual-native.win32-x64-msvc.node'
    })

    expect(
      resolveVirtualNativeBinaryPath('/workspace/core', 'win32', 'x64', fileExists)
    ).toBe('/workspace/core/src/virtual/native/virtual-native.win32-x64-msvc.node')
    expect(fileExists).toHaveBeenCalledTimes(1)
  })
})
