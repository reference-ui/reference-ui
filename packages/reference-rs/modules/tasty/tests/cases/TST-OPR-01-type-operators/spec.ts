/**
 * Station specification for TST-OPR-01-type-operators.
 * Verifies keyof, readonly, and unique type operator extraction across aliases and member types.
 * Proves primary SPEC ID anchor TST-OPR-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-OPR-01',
  async verify({ api }) {
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
  },
}

export default spec
