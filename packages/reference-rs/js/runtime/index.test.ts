import { afterEach, describe, expect, it, vi } from 'vitest'

async function importRuntimeModule() {
  vi.resetModules()

  const getVirtualNative = vi.fn(() => null)
  const getVirtualNativeUnavailableMessage = vi.fn(
    (feature: string) => `native unavailable for ${feature}`
  )

  vi.doMock('./loader', () => ({
    getVirtualNative,
    getVirtualNativeUnavailableMessage,
    getVirtualNativeCandidates: vi.fn(),
    getVirtualNativeDiagnostics: vi.fn(),
    getVirtualNativeTriple: vi.fn(),
    loadVirtualNative: vi.fn(),
    resolveReferenceRsPackageDir: vi.fn(),
    resolveVirtualNativeBinaryPath: vi.fn(),
    SUPPORTED_VIRTUAL_NATIVE_TARGETS: [],
  }))

  const mod = await import('./index')
  return { ...mod, getVirtualNative, getVirtualNativeUnavailableMessage }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./loader')
  vi.restoreAllMocks()
})

describe('runtime index', () => {
  it('throws the loader-provided consumer message when the native addon is unavailable', async () => {
    const { rewriteCssImports, getVirtualNativeUnavailableMessage } = await importRuntimeModule()

    expect(() => rewriteCssImports('body {}', 'styles.css')).toThrow(
      'native unavailable for rewrite CSS imports'
    )
    expect(getVirtualNativeUnavailableMessage).toHaveBeenCalledWith('rewrite CSS imports')
  })
})