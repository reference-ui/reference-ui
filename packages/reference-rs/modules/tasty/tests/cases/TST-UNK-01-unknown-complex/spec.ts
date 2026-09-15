/**
 * Station specification for TST-UNK-01-unknown-complex.
 * Verifies complex combinations of indexed access, mapped types, and conditionals.
 * Proves primary SPEC ID anchor TST-UNK-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-UNK-01',
  async verify({ api }) {
    const userName = await api.loadSymbolByName('UserName')
    const optionalKeys = await api.loadSymbolByName('OptionalKeys')
    const stringKeys = await api.loadSymbolByName('StringKeys')
    const usesOptionalKeys = await api.loadSymbolByName('UsesOptionalKeys')

    const userNameRaw = userName.getUnderlyingType()?.getRaw() as {
      kind?: string
      object?: { name?: string; library?: string }
      index?: { kind?: string; value?: string }
    }
    expect(userNameRaw.kind).toBe('indexed_access')
    expect(userNameRaw.object?.name).toBe('User')
    expect(userNameRaw.object?.library).toBe('user')
    expect(userNameRaw.index?.kind).toBe('literal')

    const optionalKeysRaw = optionalKeys.getUnderlyingType()?.getRaw() as {
      kind?: string
      typeParam?: string
      sourceType?: { operator?: string; target?: { name?: string } }
    }
    expect(optionalKeysRaw.kind).toBe('mapped')
    expect(optionalKeysRaw.typeParam).toBe('P')
    expect(optionalKeysRaw.sourceType?.operator).toBe('keyof')
    expect(optionalKeysRaw.sourceType?.target?.name).toBe('T')

    const partialUserType = findMember(usesOptionalKeys, 'partialUser').getType()
    expect(partialUserType?.isReference()).toBe(true)
    expect(partialUserType?.getReferencedSymbol()?.getName()).toBe('OptionalKeys')
    expect(partialUserType?.getTypeArguments()).toHaveLength(1)
    expect(partialUserType?.getTypeArguments()[0]?.getReferencedSymbol()?.getName()).toBe(
      'User'
    )

    const stringKeysRaw = stringKeys.getUnderlyingType()?.getRaw() as {
      kind?: string
      trueType?: {
        kind?: string
        nameType?: { kind?: string }
        valueType?: { kind?: string }
      }
      falseType?: { kind?: string; name?: string }
    }
    expect(stringKeysRaw.kind).toBe('conditional')
    expect(stringKeysRaw.trueType?.kind).toBe('mapped')
    expect(stringKeysRaw.trueType?.nameType?.kind).toBe('conditional')
    expect(stringKeysRaw.trueType?.valueType?.kind).toBe('indexed_access')
    expect(stringKeysRaw.falseType?.name).toBe('never')
  },
}

export default spec
