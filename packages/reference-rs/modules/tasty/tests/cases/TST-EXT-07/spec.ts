/**
 * Station specification for TST-EXT-07.
 * An `extends Array<T>` clause is a reference to the built-in `Array` with its element as a type argument, so the
 * element is a user-owned dependency at any depth. `Array` itself is listed as a reference-only dependency, the way
 * `extends Omit<...>` lists `Omit`, and it has no manifest symbol to load.
 * Proves the heritage dependency walk for a built-in base through the public graph API and the emitted descriptor.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

interface RawHeritage {
  name: string
  typeArguments?: Array<{ name?: string }>
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-07',
  async verify({ api }) {
    const dependencyNames = async (symbol: TastySymbol) =>
      (await api.graph.collectUserOwnedReferences(symbol)).map(ref => ref.getName()).sort()

    const arrHeir = await api.loadSymbolByName('ArrHeir')
    const arrNested = await api.loadSymbolByName('ArrNested')

    expect(await dependencyNames(arrHeir)).toEqual(['Array', 'UserT'])
    expect(await dependencyNames(arrNested)).toEqual(['Array', 'UserT', 'Wrap'])

    // Control: the emitted extends descriptor keeps Array with its element as the type argument.
    const heritage = (arrHeir.getRaw() as { extends: RawHeritage[] }).extends
    expect(heritage.map(ref => ref.name)).toEqual(['Array'])
    expect(heritage[0]?.typeArguments?.map(arg => arg.name)).toEqual(['UserT'])
  },
}

export default spec
