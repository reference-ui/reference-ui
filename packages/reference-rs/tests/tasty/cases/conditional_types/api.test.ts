import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('conditional_types tasty api', () => {
  addCaseRuntimeSmokeTests('conditional_types', 'IsString')
  addCaseEmittedSnapshotTests('conditional_types')

  it('loads conditional aliases and member types structurally', async () => {
    const api = createCaseApi('conditional_types')
    const isString = await api.loadSymbolByName('IsString')
    const toUser = await api.loadSymbolByName('ToUser')
    const withConditionals = await api.loadSymbolByName('WithConditionals')

    const isStringRaw = isString.getUnderlyingType()?.getRaw() as {
      kind?: string
      checkType?: { name?: string }
      extendsType?: { kind?: string; name?: string }
      trueType?: { kind?: string; value?: string }
      falseType?: { kind?: string; value?: string }
    }
    expect(isStringRaw.kind).toBe('conditional')
    expect(isStringRaw.checkType?.name).toBe('T')
    expect(isStringRaw.extendsType?.name).toBe('string')
    expect(isStringRaw.trueType?.value).toBe("'yes'")
    expect(isStringRaw.falseType?.value).toBe("'no'")

    const toUserRaw = toUser.getUnderlyingType()?.getRaw() as {
      trueType?: { name?: string; library?: string }
      falseType?: { kind?: string; name?: string }
    }
    expect(toUserRaw.trueType?.name).toBe('User')
    expect(toUserRaw.trueType?.library).toBe('user')
    expect(toUserRaw.falseType?.kind).toBe('intrinsic')
    expect(toUserRaw.falseType?.name).toBe('never')

    const userishType = findMember(withConditionals, 'userish').getType()?.getRaw() as {
      kind?: string
      trueType?: { name?: string }
    }
    expect(userishType.kind).toBe('conditional')
    expect(userishType.trueType?.name).toBe('User')
  })
})
