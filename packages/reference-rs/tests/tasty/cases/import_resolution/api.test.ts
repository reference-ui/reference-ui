import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('import_resolution tasty api', () => {
  addCaseRuntimeSmokeTests('import_resolution', 'UsesImportedTypes')

  it('resolves default and namespace imports to user-owned symbols', async () => {
    const api = createCaseApi('import_resolution')
    const symbol = await api.loadSymbolByName('UsesImportedTypes')

    const configSymbol = await findMember(symbol, 'config').getType()?.getReferencedSymbol()?.load()
    const shapeSymbol = await findMember(symbol, 'shape').getType()?.getReferencedSymbol()?.load()
    const leafSymbol = await findMember(symbol, 'leaf').getType()?.getReferencedSymbol()?.load()
    const refs = await api.graph.collectUserOwnedReferences(symbol)
    const dependencies = await api.graph.loadImmediateDependencies(symbol)

    expect(configSymbol?.getName()).toBe('DefaultConfig')
    expect(shapeSymbol?.getName()).toBe('NamespaceShape')
    expect(leafSymbol?.getName()).toBe('NamedLeaf')
    expect(refs.map((ref) => ref.getName()).sort()).toEqual([
      'DefaultConfig',
      'NamedLeaf',
      'NamespaceShape',
    ])
    expect(dependencies.map((item) => item.getName()).sort()).toEqual([
      'DefaultConfig',
      'NamedLeaf',
      'NamespaceShape',
    ])
  })
})
