import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi } from '../../api-test-helpers'

const CASE = 'same_name_user_collisions'

describe('same_name_user_collisions tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'UsesAliasedSharedProps')

  it('keeps duplicate user symbols discoverable but ambiguous by name', async () => {
    const api = createCaseApi(CASE)
    const matches = await api.findSymbolsByName('SharedProps')

    expect(matches).toHaveLength(2)
    expect(matches.map(symbol => symbol.library)).toEqual(['user', 'user'])
    expect(
      api
        .getWarnings()
        .some(warning => warning.includes('Duplicate symbol name "SharedProps"'))
    ).toBe(true)
  })

  it('cannot disambiguate same-library duplicate names with scoped lookup alone', async () => {
    const api = createCaseApi(CASE)

    await expect(api.loadSymbolByName('SharedProps')).rejects.toThrow(
      'Ambiguous symbol name "SharedProps"'
    )
    await expect(api.loadSymbolByScopedName('user', 'SharedProps')).rejects.toThrow(
      'Ambiguous symbol name "SharedProps"'
    )
  })
})
