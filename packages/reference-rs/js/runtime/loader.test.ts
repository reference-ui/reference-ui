import { afterEach, describe, expect, it, vi } from 'vitest'

async function importLoaderModule() {
  vi.resetModules()

  const existsSync = vi.fn((path: string) => path === '/workspace/packages/reference-rs/package.json')
  const readFileSync = vi.fn(() => JSON.stringify({ name: '@reference-ui/rust' }))
  const requireBinding = vi.fn(() => ({
    rewriteCssImports: vi.fn(),
    rewriteCvaImports: vi.fn(),
  }))
  const createRequire = vi.fn(() => requireBinding)
  const fileURLToPath = vi.fn(() => '/workspace/packages/reference-rs/js/runtime/loader.ts')

  vi.doMock('node:fs', () => ({
    existsSync,
    readFileSync,
  }))
  vi.doMock('node:module', () => ({
    createRequire,
  }))
  vi.doMock('node:url', () => ({
    fileURLToPath,
  }))

  const mod = await import('./loader')
  return { ...mod, createRequire, existsSync, fileURLToPath, readFileSync, requireBinding }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.doUnmock('node:module')
  vi.doUnmock('node:url')
  vi.restoreAllMocks()
})

describe('loader', () => {
  it('resolves the package dir by walking up to the package.json', async () => {
    const { existsSync, readFileSync, resolveReferenceRsPackageDir } = await importLoaderModule()

    expect(resolveReferenceRsPackageDir('file:///workspace/packages/reference-rs/js/runtime/loader.ts')).toBe(
      '/workspace/packages/reference-rs'
    )
    expect(existsSync).toHaveBeenCalledWith('/workspace/packages/reference-rs/js/runtime/package.json')
    expect(existsSync).toHaveBeenCalledWith('/workspace/packages/reference-rs/js/package.json')
    expect(existsSync).toHaveBeenCalledWith('/workspace/packages/reference-rs/package.json')
    expect(readFileSync).toHaveBeenCalledWith('/workspace/packages/reference-rs/package.json', 'utf-8')
  })

  it('builds package-root and dist candidate paths for a target triple', async () => {
    const { getVirtualNativeCandidates } = await importLoaderModule()

    expect(getVirtualNativeCandidates('/workspace/packages/reference-rs', 'darwin-arm64')).toEqual([
      '/workspace/packages/reference-rs/dist/native/virtual-native.darwin-arm64.node',
      '/workspace/packages/reference-rs/virtual-native.darwin-arm64.node',
      '/workspace/packages/reference-rs/dist/virtual-native.darwin-arm64.node',
    ])
  })

  it('returns null when no binary exists for a supported target', async () => {
    const { existsSync, resolveVirtualNativeBinaryPath } = await importLoaderModule()

    expect(resolveVirtualNativeBinaryPath('/workspace/packages/reference-rs', 'linux', 'x64')).toBeNull()
    expect(existsSync).toHaveBeenCalledTimes(3)
  })

  it('prefers the first existing candidate when resolving a binary path', async () => {
    const { resolveVirtualNativeBinaryPath } = await importLoaderModule()
    const fileExists = vi.fn((path: string) => {
      return path === '/workspace/packages/reference-rs/dist/native/virtual-native.win32-x64-msvc.node'
    })

    expect(
      resolveVirtualNativeBinaryPath('/workspace/packages/reference-rs', 'win32', 'x64', fileExists)
    ).toBe('/workspace/packages/reference-rs/dist/native/virtual-native.win32-x64-msvc.node')
    expect(fileExists).toHaveBeenCalledTimes(1)
  })
})
