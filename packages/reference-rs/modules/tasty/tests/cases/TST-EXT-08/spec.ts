/**
 * Case specification for TST-EXT-08.
 * An interface that extends an object type alias with arguments inherits the alias's members with its parameters
 * bound: `extends Alias<number>` shows `number` and `number[]`, and a generic parent `Outer<T> extends Alias<T>`
 * passes its own argument down. Proves the substitution of alias-inherited members through the display API.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-08',
  async verify({ api }) {
    const typesOf = async (symbol: TastySymbol) =>
      (await symbol.getDisplayMembers()).map(member => [member.getName(), member.getType()?.getRaw()])

    const numberType = { kind: 'intrinsic', name: 'number' }
    const useAlias = await api.loadSymbolByName('UseAlias')
    expect(await typesOf(useAlias)).toEqual([
      ['a', numberType],
      ['b', { kind: 'array', element: numberType }],
    ])

    const stringType = { kind: 'intrinsic', name: 'string' }
    const useOuter = await api.loadSymbolByName('UseOuter')
    expect(await typesOf(useOuter)).toEqual([
      ['a', stringType],
      ['b', { kind: 'array', element: stringType }],
    ])
    expect(JSON.stringify(await typesOf(useOuter))).not.toContain('"typeParameter":true')
  },
}

export default spec
