/**
 * Station specification for TST-DOC-01-jsdoc.
 * Verifies JSDoc summary and tag extraction on interfaces and property members.
 * Proves primary SPEC ID anchor TST-DOC-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DOC-01',
  async verify({ api }) {
    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const buttonSize = await api.loadSymbolByName('ButtonSize')

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

    const buttonSizeRaw = buttonSize.getRaw() as {
      description?: string
      descriptionRaw?: string
      jsdoc?: unknown
    }
    expect(buttonSizeRaw.description).toBeUndefined()
    expect(buttonSizeRaw.descriptionRaw).toBeUndefined()
    expect(buttonSizeRaw.jsdoc).toBeUndefined()
  },
}

export default spec
