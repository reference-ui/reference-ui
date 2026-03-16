import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('generics tasty api', () => {
  addCaseRuntimeSmokeTests('generics', 'Box')

  it('surfaces generic parameters, type arguments, and alias definitions', async () => {
    const api = createCaseApi('generics')
    const box = await api.loadSymbolByName('Box')
    const props = await api.loadSymbolByName('Props')
    const withGenerics = await api.loadSymbolByName('WithGenerics')
    const usesGenericRef = await api.loadSymbolByName('UsesGenericRef')

    expect(box.getTypeParameters()).toHaveLength(1)
    expect(box.getTypeParameters()[0]?.name).toBe('T')
    expect(props.getTypeParameters()[0]?.constraint).toMatchObject({ kind: 'intrinsic', name: 'object' })
    expect(withGenerics.getTypeParameters().map((param) => param.name)).toEqual(['T', 'U'])

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
  })
})
