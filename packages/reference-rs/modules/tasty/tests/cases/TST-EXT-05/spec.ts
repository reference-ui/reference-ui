/**
 * Case specification for TST-EXT-05.
 * The type arguments of an interface's extends clause are user-owned dependencies at any depth, so
 * `Base<UserT>` lists `UserT` as well as `Base`, and a type alias argument also reaches the `types` list.
 * Proves the heritage dependency walk through the public graph API and the emitted symbol.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

interface RawHeritage {
  name: string
  typeArguments?: Array<{ name?: string }>
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-05',
  async verify({ api }) {
    const direct = await api.loadSymbolByName('Direct')
    const aliased = await api.loadSymbolByName('Aliased')
    const nested = await api.loadSymbolByName('Nested')

    const dependencyNames = async (symbol: TastySymbol) =>
      (await api.graph.collectUserOwnedReferences(symbol))
        .map(ref => ref.getName())
        .sort()

    // Control: the extends descriptor keeps the argument it names.
    const directExtends = (direct.getRaw() as { extends: RawHeritage[] }).extends
    expect(directExtends.map(ref => ref.name)).toEqual(['Base'])
    expect(directExtends[0]?.typeArguments?.map(arg => arg.name)).toEqual(['UserT'])

    expect(await dependencyNames(direct)).toEqual(['Base', 'UserT'])
    expect(await dependencyNames(aliased)).toEqual(['AliasT', 'Base'])
    expect(await dependencyNames(nested)).toEqual(['Base', 'UserT', 'Wrap'])

    // The Rust reference walk puts the alias argument into the emitted `types` list.
    const aliasedTypes = (aliased.getRaw() as { types: Array<{ name: string }> }).types
    expect(aliasedTypes.map(ref => ref.name)).toEqual(['AliasT'])
  },
}

export default spec
