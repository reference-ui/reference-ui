import { describe, expect, it } from 'vitest'

import { addCaseEmittedSnapshotTests, addCaseRuntimeSmokeTests, createCaseApi } from '../../api-test-helpers'

describe('default_params tasty api', () => {
  addCaseRuntimeSmokeTests('default_params', 'WithDefault')
  addCaseEmittedSnapshotTests('default_params')

  it('surfaces defaulted type parameters and alias helpers', async () => {
    const api = createCaseApi('default_params')
    const withDefault = await api.loadSymbolByName('WithDefault')
    const keyValue = await api.loadSymbolByName('KeyValue')
    const partialDefault = await api.loadSymbolByName('PartialDefault')

    expect(withDefault.getKind()).toBe('typeAlias')
    expect(withDefault.getTypeParameters()[0]?.default).toMatchObject({ kind: 'intrinsic', name: 'string' })
    expect(withDefault.getUnderlyingType()?.getKind()).toBe('object')
    expect(withDefault.getUnderlyingType()?.describe()).toBe('{ ... }')

    const keyValueParams = keyValue.getTypeParameters()
    expect(keyValueParams.find((param) => param.name === 'K')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'string',
    })
    expect(keyValueParams.find((param) => param.name === 'V')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'unknown',
    })

    const partialParams = partialDefault.getTypeParameters()
    expect(partialParams.find((param) => param.name === 'T')?.default).toBeUndefined()
    expect(partialParams.find((param) => param.name === 'U')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'number',
    })
  })
})
