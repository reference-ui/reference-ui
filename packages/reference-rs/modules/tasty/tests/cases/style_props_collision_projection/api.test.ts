import { describe, expect, it } from 'vitest'

import {
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

const CASE = 'style_props_collision_projection'

function memberNames(
  members: Array<{ getName(): string }> | undefined
): string[] | undefined {
  return members?.map(member => member.getName())
}

describe('style_props_collision_projection tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'PublicStyleProps')

  it('keeps the exported PublicStyleProps projection intact even when same-name user symbols exist elsewhere', async () => {
    const api = createCaseApi(CASE)
    const matches = await api.findSymbolsByName('StyleProps')
    const publicStyleProps = await api.loadSymbolByName('PublicStyleProps')
    const usesPublicStyleProps = await api.loadSymbolByName('UsesPublicStyleProps')

    expect(matches).toHaveLength(3)
    expect(matches.map(symbol => symbol.library)).toEqual(['user', 'user', 'user'])
    expect(memberNames(await publicStyleProps.getDisplayMembers())?.sort()).toEqual([
      'color',
      'container',
      'display',
      'font',
      'r',
      'weight',
    ])
    expect(publicStyleProps.getMembers()).toEqual([])
    expect(findMember(usesPublicStyleProps, 'style').getType()?.describe()).toBe(
      'PublicStyleProps'
    )
    expect(
      api
        .getWarnings()
        .some(warning => warning.includes('Duplicate symbol name "StyleProps"'))
    ).toBe(true)
  })

  it('rejects ambiguous bare-name and scoped-name lookup for the colliding local StyleProps name', async () => {
    const api = createCaseApi(CASE)

    await expect(api.loadSymbolByName('StyleProps')).rejects.toThrow(
      'Ambiguous symbol name "StyleProps"'
    )
    await expect(api.loadSymbolByScopedName('user', 'StyleProps')).rejects.toThrow(
      'Ambiguous symbol name "StyleProps" within library "user"'
    )
  })
})
