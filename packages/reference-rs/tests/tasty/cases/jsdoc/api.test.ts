import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('jsdoc tasty api', () => {
  addCaseRuntimeSmokeTests('jsdoc', 'ButtonProps')

  it('keeps symbol and member jsdoc data on the raw contract', async () => {
    const api = createCaseApi('jsdoc')
    const buttonProps = await api.loadSymbolByName('ButtonProps')

    const raw = buttonProps.getRaw() as {
      description?: string
      descriptionRaw?: string
      jsdoc?: { summary?: string; tags?: Array<{ name?: string; value?: string }> }
    }
    expect(raw.description).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(raw.descriptionRaw).toContain('@deprecated Use NewButtonProps instead.')
    expect(raw.jsdoc?.summary).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(raw.jsdoc?.tags?.map((tag) => tag.name)).toEqual(['deprecated', 'remarks'])

    const sizeMemberRaw = findMember(buttonProps, 'size').getRaw() as {
      description?: string
      descriptionRaw?: string
      jsdoc?: { tags?: Array<{ name?: string; value?: string }> }
    }
    expect(sizeMemberRaw.description).toBe('Preferred size variant.')
    expect(sizeMemberRaw.descriptionRaw).toContain('@default "sm"')
    expect(sizeMemberRaw.jsdoc?.tags?.map((tag) => tag.name)).toEqual(['default', 'example'])

    const disabledRaw = findMember(buttonProps, 'disabled').getRaw() as {
      description?: string
      descriptionRaw?: string
      jsdoc?: unknown
    }
    expect(disabledRaw.description).toBe('Plain comment fallback.')
    expect(disabledRaw.descriptionRaw).toBe('Plain comment fallback.')
    expect(disabledRaw.jsdoc).toBeUndefined()
  })
})
