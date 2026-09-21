/**
 * Test suite for the native binary loader and platform resolution mechanics.
 * Verifies candidate discovery, fallback across platform packages, and error reporting.
 * Asserts stable resolution across Darwin, Linux, and Windows target triples.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getVirtualNativePackageName, getVirtualNativeTriple } from './shared/targets'
import { REQUIRED_VIRTUAL_NATIVE_EXPORTS } from './shared/native-contract'

function createDefaultMockBinding() {
  const binding: Record<string, unknown> = {
    getNativeCapabilities: vi.fn(() => JSON.stringify({ schema: 1 })),
  }
  for (const name of REQUIRED_VIRTUAL_NATIVE_EXPORTS) {
    binding[name] = vi.fn()
  }
  return binding
}

async function importLoaderModule(options?: {
  currentModulePath?: string
  existingPaths?: string[]
  packageJson?: Record<string, unknown>
  requireImpl?: (path: string) => unknown
  requireResolveImpl?: (path: string) => string
}) {
  vi.resetModules()

  const currentModulePath =
    options?.currentModulePath ?? '/workspace/packages/reference-rs/js/runtime/loader.ts'
  const existingPaths = new Set(
    options?.existingPaths ?? ['/workspace/packages/reference-rs/package.json']
  )
  const existsSync = vi.fn((path: string) => existingPaths.has(path))
  const readFileSync = vi.fn(() =>
    JSON.stringify(options?.packageJson ?? { name: '@reference-ui/rust' })
  )
  const requireBinding = vi.fn(options?.requireImpl ?? createDefaultMockBinding)
  const requireResolve = vi.fn(
    options?.requireResolveImpl ??
      ((path: string) => {
        throw new Error(`Cannot resolve ${path}`)
      })
  )
  Object.assign(requireBinding, { resolve: requireResolve })
  const createRequire = vi.fn(() => requireBinding)
  const fileURLToPath = vi.fn(() => currentModulePath)

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
  return {
    ...mod,
    createRequire,
    existsSync,
    fileURLToPath,
    readFileSync,
    requireBinding,
    requireResolve,
  }
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
    const { existsSync, readFileSync, resolveReferenceRsPackageDir } =
      await importLoaderModule()

    expect(
      resolveReferenceRsPackageDir(
        'file:///workspace/packages/reference-rs/js/runtime/loader.ts'
      )
    ).toBe('/workspace/packages/reference-rs')
    expect(existsSync).toHaveBeenCalledWith(
      '/workspace/packages/reference-rs/js/runtime/package.json'
    )
    expect(existsSync).toHaveBeenCalledWith(
      '/workspace/packages/reference-rs/js/package.json'
    )
    expect(existsSync).toHaveBeenCalledWith(
      '/workspace/packages/reference-rs/package.json'
    )
    expect(readFileSync).toHaveBeenCalledWith(
      '/workspace/packages/reference-rs/package.json',
      'utf-8'
    )
  })

  it('builds native candidate path for a target triple', async () => {
    const { getVirtualNativeCandidates } = await importLoaderModule()

    expect(
      getVirtualNativeCandidates('/workspace/packages/reference-rs', 'darwin-arm64')
    ).toEqual([
      '/workspace/packages/reference-rs/dist/native/virtual-native.darwin-arm64.node',
    ])
  })

  it('honors REFERENCE_UI_NATIVE_PATH as the only candidate', async () => {
    const { getVirtualNativeCandidates } = await importLoaderModule()
    const previous = process.env.REFERENCE_UI_NATIVE_PATH
    process.env.REFERENCE_UI_NATIVE_PATH = '/tmp/trace/virtual-native.darwin-x64.node'
    try {
      expect(
        getVirtualNativeCandidates('/workspace/packages/reference-rs', 'darwin-x64')
      ).toEqual(['/tmp/trace/virtual-native.darwin-x64.node'])
    } finally {
      if (previous === undefined) delete process.env.REFERENCE_UI_NATIVE_PATH
      else process.env.REFERENCE_UI_NATIVE_PATH = previous
    }
  })

  it('ignores an empty REFERENCE_UI_NATIVE_PATH', async () => {
    const { getVirtualNativeCandidates } = await importLoaderModule()
    const previous = process.env.REFERENCE_UI_NATIVE_PATH
    process.env.REFERENCE_UI_NATIVE_PATH = ''
    try {
      expect(
        getVirtualNativeCandidates('/workspace/packages/reference-rs', 'darwin-x64')
      ).toEqual([
        '/workspace/packages/reference-rs/dist/native/virtual-native.darwin-x64.node',
      ])
    } finally {
      if (previous === undefined) delete process.env.REFERENCE_UI_NATIVE_PATH
      else process.env.REFERENCE_UI_NATIVE_PATH = previous
    }
  })

  it('also resolves binaries from the installed platform package when present', async () => {
    const { resolveVirtualNativeBinaryPath } = await importLoaderModule({
      requireResolveImpl: (path: string) => {
        expect(path).toBe('@reference-ui/rust-linux-x64-gnu/package.json')
        return '/workspace/app/node_modules/@reference-ui/rust-linux-x64-gnu/package.json'
      },
    })
    const fileExists = vi.fn((path: string) => {
      return (
        path ===
        '/workspace/app/node_modules/@reference-ui/rust-linux-x64-gnu/virtual-native.linux-x64-gnu.node'
      )
    })

    expect(
      resolveVirtualNativeBinaryPath(
        '/workspace/app/node_modules/@reference-ui/rust',
        'linux',
        'x64',
        fileExists
      )
    ).toBe(
      '/workspace/app/node_modules/@reference-ui/rust-linux-x64-gnu/virtual-native.linux-x64-gnu.node'
    )
  })

  it('returns null when no binary exists for a supported target', async () => {
    const { existsSync, resolveVirtualNativeBinaryPath } = await importLoaderModule()

    expect(
      resolveVirtualNativeBinaryPath('/workspace/packages/reference-rs', 'linux', 'x64')
    ).toBeNull()
    expect(existsSync).toHaveBeenCalledTimes(1)
  })

  it('prefers the first existing candidate when resolving a binary path', async () => {
    const { resolveVirtualNativeBinaryPath } = await importLoaderModule()
    const fileExists = vi.fn((path: string) => {
      return (
        path ===
        '/workspace/packages/reference-rs/dist/native/virtual-native.win32-x64-msvc.node'
      )
    })

    expect(
      resolveVirtualNativeBinaryPath(
        '/workspace/packages/reference-rs',
        'win32',
        'x64',
        fileExists
      )
    ).toBe(
      '/workspace/packages/reference-rs/dist/native/virtual-native.win32-x64-msvc.node'
    )
    expect(fileExists).toHaveBeenCalledTimes(1)
  })

  it('rejects stale binaries that do not advertise required capabilities', async () => {
    const triple = getVirtualNativeTriple(process.platform, process.arch)
    expect(triple).not.toBeNull()

    const missingCapabilityBinding = () => {
      const binding: Record<string, unknown> = {}
      for (const name of REQUIRED_VIRTUAL_NATIVE_EXPORTS) {
        if (name !== 'getNativeCapabilities') {
          binding[name] = vi.fn()
        }
      }
      return binding
    }

    const {
      getVirtualNativeCompatibilityError,
      getVirtualNativeDiagnostics,
      loadVirtualNative,
    } = await importLoaderModule({
      existingPaths: [
        '/workspace/packages/reference-rs/package.json',
        `/workspace/packages/reference-rs/dist/native/virtual-native.${triple}.node`,
      ],
      requireImpl: missingCapabilityBinding,
    })

    expect(getVirtualNativeCompatibilityError(missingCapabilityBinding())).toContain(
      'getNativeCapabilities'
    )
    expect(loadVirtualNative()).toBeNull()
    expect(getVirtualNativeDiagnostics().status).toBe('load-failed')
    expect(getVirtualNativeDiagnostics().cause).toContain('Incompatible native binary')
  })

  it('returns a consumer-safe missing-binary message without monorepo pnpm guidance', async () => {
    const { getVirtualNativeUnavailableMessage } = await importLoaderModule({
      currentModulePath:
        '/workspace/app/node_modules/@reference-ui/rust/js/runtime/loader.ts',
      existingPaths: ['/workspace/app/node_modules/@reference-ui/rust/package.json'],
    })

    const message = getVirtualNativeUnavailableMessage('rewrite CSS imports')
    const triple = getVirtualNativeTriple(process.platform, process.arch)

    expect(triple).not.toBeNull()
    const packageName = getVirtualNativePackageName(triple!)

    expect(message).toContain(
      'Prebuilt binaries for @reference-ui/rust should install automatically'
    )
    expect(message).toContain(`Expected optional target package: ${packageName}`)
    expect(message).toContain(
      `The platform package ${packageName} was not installed alongside @reference-ui/rust`
    )
    expect(message).toContain('Searched paths:')
    expect(message).toContain(
      'Reinstall dependencies so your package manager can fetch the correct prebuilt binary'
    )
    expect(message).not.toContain('pnpm --filter @reference-ui/rust run build')
  })

  it('adds contributor guidance only for workspace checkouts', async () => {
    const { getVirtualNativeUnavailableMessage } = await importLoaderModule({
      existingPaths: ['/workspace/packages/reference-rs/package.json'],
    })

    const message = getVirtualNativeUnavailableMessage('rewrite CSS imports')

    expect(message).toContain('pnpm --filter @reference-ui/rust run build')
  })
})
