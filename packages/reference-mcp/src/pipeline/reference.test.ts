// Vitest tests for tasty reference-document loading.
// They take fixture manifests and assert per-component data, warning formatting, and the per-call truncated mark
// that a display projection cut by its step budget leaves on the component's reference data.
import { describe, expect, it, vi } from 'vitest'

const createReferenceDocument = vi.fn(() => ({ id: 'doc' }))

vi.mock('@reference-ui/core/reference', () => ({
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

describe('loadMcpReferenceData', () => {
  function apiWithProjection(result: { members: unknown[]; truncated: boolean }) {
    return {
      loadSymbolByScopedName: vi.fn(async () => ({
        getKind: () => 'interface',
        getDescription: () => undefined,
        getId: () => 'button-props',
      })),
      loadSymbolByName: vi.fn(),
      graph: {
        getDisplayResult: vi.fn(async () => result),
      },
      getWarnings: vi.fn(() => []),
    }
  }

  it('marks the reference truncated when its own display projection ran out of steps', async () => {
    const api = apiWithProjection({ members: [], truncated: true })

    const { loadMcpReferenceData } = await import('./reference')
    const data = await loadMcpReferenceData(api as never, 'ButtonProps', './components/Button.tsx')

    expect(api.graph.getDisplayResult).toHaveBeenCalledTimes(1)
    expect(data).toMatchObject({ truncated: true })
  })

  it('leaves the mark off a reference whose projection completed', async () => {
    const api = apiWithProjection({ members: [], truncated: false })

    const { loadMcpReferenceData } = await import('./reference')
    const data = await loadMcpReferenceData(api as never, 'ButtonProps', './components/Button.tsx')

    expect(data).not.toHaveProperty('truncated')
  })
})
