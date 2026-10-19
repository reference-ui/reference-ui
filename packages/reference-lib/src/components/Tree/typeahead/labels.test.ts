/**
 * Proof for Tree typeahead label extraction. Pins explicit textValue
 * first, decoration stripped with digits kept, and trimmed row text as
 * the fallback search label.
 */
import { describe, expect, it } from 'vitest'
import { extractTypeaheadText } from './labels'

function elWithTextValue(textValue: string | null, clone?: { textContent: string | null }) {
  return {
    getAttribute: (name: string) => (name === 'data-text-value' ? textValue : null),
    cloneNode: () => ({
      querySelectorAll: () => [],
      textContent: clone?.textContent ?? null,
    }),
  } as unknown as HTMLElement
}

describe('extractTypeaheadText', () => {
  it('prefers the explicit textValue', () => {
    expect(extractTypeaheadText(elWithTextValue('Photos'))).toBe('Photos')
  })

  it('strips leading decoration but keeps digits as content', () => {
    expect(extractTypeaheadText(elWithTextValue('📁 Photos'))).toBe('Photos')
    expect(extractTypeaheadText(elWithTextValue('0 backups'))).toBe('0 backups')
    expect(extractTypeaheadText(elWithTextValue('— draft'))).toBe('draft')
  })

  it('falls back to trimmed row text without decoration', () => {
    expect(extractTypeaheadText(elWithTextValue(null, { textContent: '  📁 Music  ' }))).toBe(
      'Music'
    )
  })
})
