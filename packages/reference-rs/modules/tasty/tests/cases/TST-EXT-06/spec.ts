/**
 * Case specification for TST-EXT-06.
 * An interface's inherited members take the type arguments of its extends clause. `extends Holder<number>` shows
 * `number` for the parameter A and for B, whose default is A, and a chain through the generic parent `Outer<T>`
 * passes `string` down to `Holder`. The declaration itself keeps its own parameters.
 * Proves the substitution of inherited members through the public display API.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-06',
  async verify({ api }) {
    const displayMembers = async (symbol: TastySymbol) => symbol.getDisplayMembers()
    const typeOf = async (symbol: TastySymbol, name: string) =>
      (await displayMembers(symbol))
        .find(member => member.getName() === name)
        ?.getType()
        ?.getRaw()

    const holder = await api.loadSymbolByName('Holder')
    const useHolder = await api.loadSymbolByName('UseHolder')
    const useOuter = await api.loadSymbolByName('UseOuter')

    // Control: the declaration keeps its own parameter, since no argument binds it.
    expect(await typeOf(holder, 'first')).toMatchObject({ name: 'A', typeParameter: true })

    // `extends Holder<number>`: A is number, and B = A follows it.
    const numberType = { kind: 'intrinsic', name: 'number' }
    expect(await typeOf(useHolder, 'first')).toEqual(numberType)
    expect(await typeOf(useHolder, 'second')).toEqual(numberType)

    // `extends Outer<string>` through `Outer<T> extends Holder<T>`: the argument flows through the generic parent.
    const stringType = { kind: 'intrinsic', name: 'string' }
    expect(await typeOf(useOuter, 'first')).toEqual(stringType)
    expect(await typeOf(useOuter, 'second')).toEqual(stringType)

    // No inherited member keeps a type-parameter reference after the projection.
    for (const symbol of [useHolder, useOuter]) {
      const types = (await displayMembers(symbol)).map(member => member.getType()?.getRaw())
      expect(JSON.stringify(types)).not.toContain('"typeParameter":true')
    }
  },
}

export default spec
