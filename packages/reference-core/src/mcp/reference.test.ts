import { describe, expect, it, vi } from 'vitest'

const createReferenceDocument = vi.fn(() => ({ id: 'doc' }))

vi.mock('../reference/browser/model', () => ({
  createReferenceDocument,
}))

describe('loadReferenceDocument', () => {
  it('prefers user-scoped symbol lookup for local interfaces', async () => {
    const loadSymbolByScopedName = vi.fn(async () => ({
      getKind: () => 'typeAlias',
      getUnderlyingType: () => null,
      getDisplayMembers: async () => [],
      getId: () => 'button-props',
    }))
    const api = {
      loadSymbolByScopedName,
      loadSymbolByName: vi.fn(),
      graph: {
        getDisplayMembers: vi.fn(async () => []),
        loadExtendsChain: vi.fn(async () => []),
        collectUserOwnedReferences: vi.fn(async () => []),
      },
      getWarnings: vi.fn(() => []),
    }

    const { loadReferenceDocument } = await import('./reference')

    await loadReferenceDocument(api as never, 'ButtonProps', './components/Button.tsx')

    expect(loadSymbolByScopedName).toHaveBeenCalledWith('user', 'ButtonProps')
    expect(api.loadSymbolByName).not.toHaveBeenCalled()
  })

  it('scopes package interfaces to the package library name', async () => {
    const loadSymbolByScopedName = vi.fn(async () => ({
      getKind: () => 'interface',
      getMembers: async () => [],
      getId: () => 'pkg-button-props',
    }))
    const api = {
      loadSymbolByScopedName,
      loadSymbolByName: vi.fn(),
      graph: {
        getDisplayMembers: vi.fn(async () => []),
        loadExtendsChain: vi.fn(async () => []),
        collectUserOwnedReferences: vi.fn(async () => []),
      },
      getWarnings: vi.fn(() => []),
    }

    const { loadReferenceDocument } = await import('./reference')

    await loadReferenceDocument(api as never, 'ButtonProps', '@reference-ui/react')

    expect(loadSymbolByScopedName).toHaveBeenCalledWith(
      '@reference-ui/react',
      'ButtonProps'
    )
    expect(api.loadSymbolByName).not.toHaveBeenCalled()
  })
})
