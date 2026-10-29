/**
 * Case specification for TST-EXT-09.
 * A generic method keeps its own type parameter when an inherited extends clause binds a parent parameter of the
 * same name: `keep` takes the clause's argument, while `run<A>(input: A): A` still returns the method's own `A`.
 * Proves that the substitution of inherited members does not capture a method's shadowing parameter, for an
 * interface parent and for an object type alias parent.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-09',
  async verify({ api }) {
    const typeOf = async (symbol: TastySymbol, name: string) =>
      (await symbol.getDisplayMembers())
        .find(member => member.getName() === name)
        ?.getType()
        ?.getRaw()

    const numberType = { kind: 'intrinsic', name: 'number' }
    for (const name of ['UseHolder', 'UseBox']) {
      const symbol = await api.loadSymbolByName(name)
      expect(await typeOf(symbol, 'keep'), `${name}.keep`).toEqual(numberType)
      expect(await typeOf(symbol, 'run'), `${name}.run`).toMatchObject({
        kind: 'function',
        returnType: { name: 'A', typeParameter: true },
      })
    }
  },
}

export default spec
