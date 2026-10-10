import { describe, expect, it } from 'vitest'
import { isLogicalDigitChar, offsetAfterLogicalDigits } from './caret'

describe('logical caret model', () => {
  it('counts ASCII and active-system glyphs as digits', () => {
    expect(isLogicalDigitChar('5', '0123456789')).toBe(true)
    expect(isLogicalDigitChar('٣', '٠١٢٣٤٥٦٧٨٩')).toBe(true)
    expect(isLogicalDigitChar(',', '0123456789')).toBe(false)
    expect(isLogicalDigitChar('٣', '0123456789')).toBe(false)
  })

  it('maps preceding-digit counts across formatting replacements', () => {
    // Caret after "1,0" (2 digits) lands after the 2nd digit of "1,000".
    expect(offsetAfterLogicalDigits('1,000', 2, '0123456789')).toBe(3)
    // No preceding digit anchors to text start.
    expect(offsetAfterLogicalDigits('1,000', 0, '0123456789')).toBe(0)
    // An unsatisfiable count clamps to the end.
    expect(offsetAfterLogicalDigits('1,0', 9, '0123456789')).toBe(3)
  })
})
