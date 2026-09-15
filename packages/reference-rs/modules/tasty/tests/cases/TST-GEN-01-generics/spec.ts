/**
 * Station specification for TST-GEN-01-generics.
 * Verifies generic type parameters, constraints, underlying structures, and type arguments.
 * Proves primary SPEC ID anchor TST-GEN-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-GEN-01',
  async verify({ api }) {
    const box = await api.loadSymbolByName('Box')
    const props = await api.loadSymbolByName('Props')
    const withGenerics = await api.loadSymbolByName('WithGenerics')
    const usesGenericRef = await api.loadSymbolByName('UsesGenericRef')

    expect(box.getTypeParameters()).toHaveLength(1)
    expect(box.getTypeParameters()[0]?.name).toBe('T')
    expect(props.getTypeParameters()[0]?.constraint).toMatchObject({
      kind: 'intrinsic',
      name: 'object',
    })
    expect(withGenerics.getTypeParameters().map(param => param.name)).toEqual(['T', 'U'])

    const boxUnderlying = box.getUnderlyingType()?.getRaw() as {
      kind?: string
      members?: Array<{ name?: string }>
    }
    expect(boxUnderlying.kind).toBe('object')
    expect(boxUnderlying.members?.[0]?.name).toBe('value')

    const itemType = findMember(usesGenericRef, 'item').getType()
    expect(itemType?.isReference()).toBe(true)
    expect(itemType?.getReferencedSymbol()?.getName()).toBe('Props')
    expect(itemType?.getTypeArguments()).toHaveLength(1)
    expect(itemType?.getTypeArguments()[0]?.describe()).toBe('Box<string>')
  },
}

export default spec
