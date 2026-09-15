/**
 * Station specification for TST-INT-03-intersection-patterns.
 * Verifies intersection member merging, override semantics, utility combination, and generic intersections.
 * Proves primary SPEC ID anchor TST-INT-03.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyApi, TastyCaseResult } from '../../helpers.js'

async function displayMemberMap(api: TastyApi, symbolName: string): Promise<Map<string, string>> {
  const symbol = await api.loadSymbolByName(symbolName)
  const members = await api.graph.getDisplayMembers(symbol)
  return new Map(members.map((m) => [m.getName(), m.getType()?.describe() ?? '']))
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-INT-03',
  async verify({ api }) {
    const basic = await displayMemberMap(api, 'MergedBasic')
    expect([...basic.keys()].sort()).toEqual(['a', 'b', 'shared'])

    const override = await displayMemberMap(api, 'IntersectionOverride')
    expect([...override.keys()].sort()).toEqual(['field', 'other'])
    expect(override.get('field')).toMatch(/string/i)

    const utilLiteral = await displayMemberMap(api, 'IntersectionUtilityLiteral')
    expect([...utilLiteral.keys()].sort()).toEqual(['x', 'y'])
    expect(utilLiteral.get('x')).toMatch(/string/i)

    const multi = await displayMemberMap(api, 'IntersectionMultiple')
    expect([...multi.keys()].sort()).toEqual(['a', 'b', 'c', 'd'])

    const generic = await displayMemberMap(api, 'MergedGeneric')
    expect([...generic.keys()].sort()).toEqual(['extra', 'flag', 'id', 'name'])
    expect(generic.get('name')).toMatch(/number/i)
  },
}

export default spec
