import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('type_operators tasty api', () => {
  addCaseRuntimeSmokeTests('type_operators', 'KeysOfUser')

  it('surfaces type operators through aliases and member wrappers', async () => {
    const api = createCaseApi('type_operators')
    const keysOfUser = await api.loadSymbolByName('KeysOfUser')
    const readonlyUsers = await api.loadSymbolByName('ReadonlyUsers')
    const withOperators = await api.loadSymbolByName('WithOperators')

    const keysRaw = keysOfUser.getUnderlyingType()?.getRaw() as {
      kind?: string
      operator?: string
      target?: { name?: string; library?: string }
    }
    expect(keysRaw.kind).toBe('type_operator')
    expect(keysRaw.operator).toBe('keyof')
    expect(keysRaw.target?.name).toBe('User')
    expect(keysRaw.target?.library).toBe('user')

    const readonlyRaw = readonlyUsers.getUnderlyingType()?.getRaw() as {
      operator?: string
      target?: { kind?: string; element?: { name?: string } }
    }
    expect(readonlyRaw.operator).toBe('readonly')
    expect(readonlyRaw.target?.kind).toBe('array')
    expect(readonlyRaw.target?.element?.name).toBe('User')

    const tokenType = findMember(withOperators, 'token').getType()?.getRaw() as {
      kind?: string
      operator?: string
      target?: { kind?: string; name?: string }
    }
    expect(tokenType.kind).toBe('type_operator')
    expect(tokenType.operator).toBe('unique')
    expect(tokenType.target?.kind).toBe('intrinsic')
    expect(tokenType.target?.name).toBe('symbol')
  })
})
