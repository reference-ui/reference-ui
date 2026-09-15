/**
 * Station specification for TST-CND-01-conditional-types.
 * Verifies structural conditional type extraction, branch resolution, and member conditionals.
 * Proves primary SPEC ID anchor TST-CND-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-CND-01',
  async verify({ api }) {
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
  },
}

export default spec
