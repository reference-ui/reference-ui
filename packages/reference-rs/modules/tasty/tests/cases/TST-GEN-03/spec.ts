/**
 * Case specification for TST-GEN-03.
 * A type parameter or `infer` variable that shares a name with a top-level symbol binds its own
 * references: they carry no symbol id, while an unshadowed reference still resolves to the symbol.
 * Proves the shadowing claims for interface parameters, method and function-type parameters, conditional
 * `infer` (also inside an object-literal extends clause), and mapped-type keys.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult, type TastySymbol } from '../../harness/helpers.js'

interface RefJson {
  kind?: string
  name?: string
  id?: string
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-GEN-03',
  async verify({ api }) {
    const item = await api.loadSymbolByName('Item')
    const u = await api.loadSymbolByName('U')
    const wrap = await api.loadSymbolByName('Wrap')
    const holder = await api.loadSymbolByName('Holder')
    const makeItem = await api.loadSymbolByName('MakeItem')
    const flatten = await api.loadSymbolByName('Flatten')
    const usesItem = await api.loadSymbolByName('UsesItem')

    const wrapValue = findMember(wrap, 'value').getType()?.getRaw() as RefJson
    expect(wrapValue).toMatchObject({ name: 'Item', id: 'Item' })

    const runType = findMember(holder, 'run').getType()?.getRaw() as { kind: string; returnType: RefJson }
    expect(runType.kind).toBe('function')
    const runReturn = runType.returnType
    expect(runReturn).toMatchObject({ name: 'Item', id: 'Item' })

    const makeReturn = (makeItem.getUnderlyingType()?.getRaw() as { returnType?: RefJson }).returnType
    expect(makeReturn).toMatchObject({ name: 'Item', id: 'Item' })

    const trueBranch = (flatten.getUnderlyingType()?.getRaw() as { trueType?: RefJson }).trueType
    expect(trueBranch).toMatchObject({ name: 'U', id: 'U' })
    expect(trueBranch?.id).not.toBe(u.getId())

    const unshadowed = findMember(usesItem, 'item').getType()?.getRaw() as RefJson
    expect(unshadowed).toMatchObject({ name: 'Item', id: item.getId() })

    const unwrap = await api.loadSymbolByName('Unwrap')
    const dataBranch = (unwrap.getUnderlyingType()?.getRaw() as { trueType?: RefJson }).trueType
    expect(dataBranch).toMatchObject({ name: 'Data', id: 'Data' })

    const keyed = await api.loadSymbolByName('Keyed')
    const keyedValue = (keyed.getUnderlyingType()?.getRaw() as { valueType?: RefJson }).valueType
    expect(keyedValue).toMatchObject({ name: 'Item', id: 'Item' })

    // A bound reference is not a dependency: each binder above adds no user-owned reference. The
    // unshadowed `UsesItem.item` is the control that still lists its top-level dependency.
    const dependencyNames = async (symbol: TastySymbol) =>
      (await api.graph.collectUserOwnedReferences(symbol)).map(ref => ref.getName()).sort()
    expect(await dependencyNames(wrap)).toEqual([])
    expect(await dependencyNames(holder)).toEqual([])
    expect(await dependencyNames(makeItem)).toEqual([])
    expect(await dependencyNames(flatten)).toEqual([])
    expect(await dependencyNames(unwrap)).toEqual([])
    expect(await dependencyNames(keyed)).toEqual([])
    expect(await dependencyNames(usesItem)).toEqual(['Item'])
  },
}

export default spec
