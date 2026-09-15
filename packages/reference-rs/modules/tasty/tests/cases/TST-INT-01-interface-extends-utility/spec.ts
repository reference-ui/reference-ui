/**
 * Station specification for TST-INT-01-interface-extends-utility.
 * Verifies Omit utility projection in interface extends clauses and extends chain walking.
 * Proves primary SPEC ID anchor TST-INT-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-INT-01',
  async verify({ api }) {
    const styleProps = await api.loadSymbolByName('StyleProps')
    await expect(api.graph.loadExtendsChain(styleProps)).resolves.toEqual([])
    expect(api.hasManifestSymbol('Omit')).toBe(false)

    const members = await api.graph.getDisplayMembers(styleProps)
    const names = new Set(members.map((m) => m.getName()))
    expect(names.has('keep')).toBe(true)
    expect(names.has('font')).toBe(false)
    expect(names.has('weight')).toBe(false)
    expect(names.has('extra')).toBe(true)

    const child = await api.loadSymbolByName('ChildProps')
    const chain = await api.graph.loadExtendsChain(child)
    expect(chain.map((s) => s.getName())).toEqual(['StyleProps'])
    const display = await api.graph.getDisplayMembers(child)
    expect(display.find((m) => m.getName() === 'keep')).toBeDefined()
  },
}

export default spec
