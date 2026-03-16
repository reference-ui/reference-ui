import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('tsx tasty api', () => {
  addCaseRuntimeSmokeTests('tsx', 'ButtonProps')

  it('loads symbols from tsx fixtures and preserves optional flags', async () => {
    const api = createCaseApi('tsx')
    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const buttonVariant = await api.loadSymbolByName('ButtonVariant')

    expect(findMember(buttonProps, 'label').isOptional()).toBe(false)
    expect(findMember(buttonProps, 'onClick').isOptional()).toBe(true)
    expect(findMember(buttonProps, 'disabled').isOptional()).toBe(true)
    expect(buttonVariant.getKind()).toBe('typeAlias')
    expect(buttonVariant.getUnderlyingType()?.getKind()).toBe('union')
  })
})
