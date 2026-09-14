import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('unions_literals tasty api', () => {
  addCaseRuntimeSmokeTests('unions_literals', 'Status')
  addCaseEmittedSnapshotTests('unions_literals')

  it('surfaces union and literal structures plus optional members', async () => {
    const api = createCaseApi('unions_literals')
    const status = await api.loadSymbolByName('Status')
    const stringOrNumber = await api.loadSymbolByName('StringOrNumber')
    const optionalProps = await api.loadSymbolByName('OptionalProps')
    const bigintAlias = await api.loadSymbolByName('BigintAlias')

    const statusRaw = status.getUnderlyingType()?.getRaw() as {
      kind?: string
      types?: Array<{ kind?: string; value?: string }>
    }
    expect(statusRaw.kind).toBe('union')
    expect(statusRaw.types?.some((item) => item.kind === 'literal')).toBe(true)

    const stringOrNumberRaw = stringOrNumber.getUnderlyingType()?.getRaw() as {
      kind?: string
      types?: unknown[]
    }
    expect(stringOrNumberRaw.kind).toBe('union')
    expect(stringOrNumberRaw.types).toHaveLength(2)

    expect(bigintAlias.getUnderlyingType()?.getRaw()).toMatchObject({ kind: 'intrinsic', name: 'bigint' })
    expect(findMember(optionalProps, 'name').isOptional()).toBe(false)
    expect(findMember(optionalProps, 'description').isOptional()).toBe(true)
    expect(findMember(optionalProps, 'count').isOptional()).toBe(true)
  })
})
