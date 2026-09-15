/**
 * Station specification for TST-IMP-01-import-resolution.
 * Verifies default, namespace, and named import symbol resolution and dependency graphs.
 * Proves primary SPEC ID anchor TST-IMP-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-01',
  async verify({ api }) {
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
  },
}

export default spec
