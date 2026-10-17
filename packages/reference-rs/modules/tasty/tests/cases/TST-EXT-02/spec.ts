/**
 * Case specification for TST-EXT-02.
 * `export * as tree from './leaf'` exposes one namespace. A consumer's `tree.Leaf` through the barrel
 * resolves to the `Leaf` symbol id, and the barrel exports no flat `Leaf` for a consumer to reach.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-02',
  async verify({ api }) {
    const problems: string[] = []
    const leaf = await api.loadSymbolByName('Leaf')

    const uses = await api.loadSymbolByName('UsesTree')
    const ref = findMember(uses, 'leaf').getType()?.getRaw() as { id?: string; name?: string } | undefined
    if (ref?.id !== leaf.getId()) {
      problems.push(`UsesTree.leaf (tree.Leaf via export * as tree): expected id ${leaf.getId()} got ${JSON.stringify(ref)}`)
    }

    const relayed = await api.loadSymbolByName('UsesRelayedTree')
    const relayedRef = findMember(relayed, 'leaf').getType()?.getRaw() as { id?: string; name?: string } | undefined
    if (relayedRef?.id !== leaf.getId()) {
      problems.push(`UsesRelayedTree.leaf (tree.Leaf via export { tree } from './relay'): expected id ${leaf.getId()} got ${JSON.stringify(relayedRef)}`)
    }

    const flat = await api.loadSymbolByName('UsesFlatLeaf')
    const flatRef = findMember(flat, 'flat').getType()?.getRaw() as { id?: string } | undefined
    if (flatRef?.id === leaf.getId()) {
      problems.push(`UsesFlatLeaf.flat (Leaf imported from the barrel): the barrel must not export Leaf flat, got ${JSON.stringify(flatRef)}`)
    }

    expect(problems).toEqual([])
  },
}

export default spec
