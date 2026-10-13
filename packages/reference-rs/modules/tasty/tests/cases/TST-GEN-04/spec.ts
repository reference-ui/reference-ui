/**
 * Station specification for TST-GEN-04.
 * A type parameter default that names an earlier parameter is evaluated where that parameter is bound to its
 * argument, so `Two<number>` gives `second: number` and a same-named top-level `A` never captures the default.
 * Proves the default for a supplied argument, the chained defaults of a bare reference, and a nested default.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult, TastySymbol } from '../../harness/helpers.js'

interface RawDefault {
  id?: string
  name?: string
  typeParameter?: boolean
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-GEN-04',
  async verify({ api }) {
    const topA = await api.loadSymbolByName('A')
    const two = await api.loadSymbolByName('Two')
    const useTwo = await api.loadSymbolByName('UseTwo')
    const useBare = await api.loadSymbolByName('UseTwoBare')
    const useNest = await api.loadSymbolByName('UseNest')

    // The projected type of one member; a bare reference is expanded by the projection, not by the scan.
    const displayType = async (symbol: TastySymbol, name: string) =>
      (await symbol.getDisplayMembers())
        .find(member => member.getName() === name)
        ?.getType()
        ?.getRaw()

    // Control: the declaration's own default names the parameter, not the top-level symbol.
    const bParam = two.getTypeParameters()[1] as { default?: RawDefault } | undefined
    expect(bParam?.default).toMatchObject({ name: 'A', typeParameter: true })
    expect(bParam?.default?.id).not.toBe(topA.getId())

    // `Two<number>`: A is supplied, so the default of B evaluates to A's argument.
    const numberType = { kind: 'intrinsic', name: 'number' }
    expect(await displayType(useTwo, 'first')).toEqual(numberType)
    expect(await displayType(useTwo, 'second')).toEqual(numberType)

    // `Two2` used bare: A takes its default `string`, and the default of B follows it.
    const stringType = { kind: 'intrinsic', name: 'string' }
    expect(await displayType(useBare, 'first')).toEqual(stringType)
    expect(await displayType(useBare, 'second')).toEqual(stringType)

    // `Nest<string>`: the default of B is an object whose member names A, so that member takes `string`.
    expect(await displayType(useNest, 'value')).toMatchObject({
      kind: 'object',
      members: [{ name: 'inner', type: stringType }],
    })

    // A parameter names no symbol, so no expansion depends on the top-level A. The bare `UseTwoBare` depends on
    // `Two2` itself, which it names; nothing else is a dependency.
    const dependencyNames = async (symbol: TastySymbol) =>
      (await api.graph.collectUserOwnedReferences(symbol))
        .map(ref => ref.getName())
        .sort()
    expect(await dependencyNames(useTwo)).toEqual([])
    expect(await dependencyNames(useBare)).toEqual(['Two2'])
    expect(await dependencyNames(useNest)).toEqual([])
  },
}

export default spec
