/**
 * Combobox id proof: generated ids and their uniqueness guarantees. Pure
 * naming decisions; the parts and registry consume them.
 */
import { describe, expect, it } from 'vitest'
import { sanitizeComboboxId, sanitizeIdSegment } from './ids'

describe('combobox ids', () => {
  it('strips selector-breaking characters from segments', () => {
    expect(sanitizeIdSegment('a:b c.d/e')).toBe('abcde')
    expect(sanitizeIdSegment('ok-_9Z')).toBe('ok-_9Z')
  })

  it('prefixes popover ids', () => {
    expect(sanitizeComboboxId('r0')).toBe('ref-cb-pop-r0')
    expect(sanitizeComboboxId('r:0')).toBe('ref-cb-pop-r0')
  })
})
