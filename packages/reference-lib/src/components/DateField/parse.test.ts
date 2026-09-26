// Parse-kit contract: pure locale format/parse/step/constrain helpers.
// Ported verbatim from quarantine 1150c8e6e (parse.ts); staged foundation,
// NOT wired into DateField (wiring = locale display = visual change).
// Titles carry no DF-* IDs: per TESTS.md, [unit] IDs are proven only by
// DOM-light renders of public components, never by parser-helper tests.
import { describe, expect, it } from 'vitest'
import {
  assertValidDateBounds,
  formatLocalDate,
  getLocaleSegmentOrder,
  getSegmentAtCaret,
  isDateWithinConstraints,
  normalizeDigits,
  parseLocalDate,
  stepDateSegment,
} from './parse'

describe('parse-kit locale format', () => {
  it('formats en-GB as day/month/year', () => {
    expect(formatLocalDate('2024-02-01', 'en-GB')).toBe('01/02/2024')
  })

  it('formats en-US as month/day/year', () => {
    expect(formatLocalDate('2024-02-01', 'en-US')).toMatch(/^0?2\/0?1\/2024$/)
  })

  it('formats de-DE with dot separators and sv-SE as ISO-like', () => {
    expect(formatLocalDate('2024-02-01', 'de-DE')).toMatch(/^0?1\.0?2\.2024$/)
    expect(formatLocalDate('2024-02-01', 'sv-SE')).toBe('2024-02-01')
  })

  it('formats ja-JP with year/month/day literals', () => {
    const text = formatLocalDate('2024-02-01', 'ja-JP')
    expect(text).toContain('年')
    expect(text).toContain('月')
    expect(text).toContain('日')
  })

  it('orders segments per locale grammar', () => {
    expect(getLocaleSegmentOrder('en-GB')).toEqual(['day', 'month', 'year'])
    expect(getLocaleSegmentOrder('en-US')).toEqual(['month', 'day', 'year'])
    expect(getLocaleSegmentOrder('ja-JP')).toEqual(['year', 'month', 'day'])
  })
})

describe('parse-kit locale parse', () => {
  it('parses 01/02/2024 as Feb 1 under en-GB and Jan 2 under en-US', () => {
    expect(parseLocalDate('01/02/2024', 'en-GB').iso).toBe('2024-02-01')
    expect(parseLocalDate('01/02/2024', 'en-US').iso).toBe('2024-01-02')
  })

  it('round-trips de-DE dots and sv-SE dashes', () => {
    expect(parseLocalDate('01.02.2024', 'de-DE').iso).toBe('2024-02-01')
    expect(parseLocalDate('2024-02-01', 'sv-SE').iso).toBe('2024-02-01')
  })

  it('accepts Japanese digits with omitted literals while typing', () => {
    expect(parseLocalDate('2024/2/1', 'ja-JP').iso).toBe('2024-02-01')
  })

  it('accepts ASCII mixed with one locale digit set', () => {
    expect(parseLocalDate('١/2/٢٠٢٤', 'ar-EG').iso).toBe('2024-02-01')
  })

  it('rejects mixing two non-ASCII digit scripts', () => {
    const mixed = parseLocalDate('١/१/2024', 'ar-EG')
    expect(mixed.valid).toBe(false)
    expect(mixed.iso).toBeNull()
    expect(normalizeDigits('١१').valid).toBe(false)
    expect(normalizeDigits('١/2/٢٠٢٤')).toEqual({ text: '1/2/2024', valid: true })
  })

  it('treats empty text as valid null and partial text as incomplete', () => {
    expect(parseLocalDate('', 'en-GB')).toEqual({ valid: true, incomplete: false, iso: null })
    expect(parseLocalDate('3/', 'en-GB').incomplete).toBe(true)
    expect(parseLocalDate('31/0', 'en-GB').incomplete).toBe(true)
  })

  it('treats two-digit years as incomplete', () => {
    const result = parseLocalDate('31/12/24', 'en-GB')
    expect(result.valid).toBe(false)
    expect(result.incomplete).toBe(true)
    expect(result.iso).toBeNull()
  })

  it('rejects impossible Gregorian dates without overflow', () => {
    for (const text of ['31/04/2024', '29/02/2023', '2024-04-31']) {
      const result = parseLocalDate(text, 'en-GB')
      expect(result.valid).toBe(false)
      expect(result.incomplete).toBe(false)
      expect(result.iso).toBeNull()
    }
  })

  it('accepts 29 February only on Gregorian leap years', () => {
    expect(parseLocalDate('29/02/2024', 'en-GB').iso).toBe('2024-02-29')
    expect(parseLocalDate('29/02/1900', 'en-GB').valid).toBe(false)
  })

  it('allows omitted leading zeros', () => {
    expect(parseLocalDate('3/4/2024', 'en-GB').iso).toBe('2024-04-03')
  })

  it('accepts canonical ISO as interchange in any locale', () => {
    expect(parseLocalDate('2024-12-31', 'en-GB').iso).toBe('2024-12-31')
    expect(parseLocalDate('2024-12-31', 'en-US').iso).toBe('2024-12-31')
  })
})

describe('parse-kit caret segments and stepping', () => {
  it('resolves the caret segment from en-GB digit spans', () => {
    expect(getSegmentAtCaret('15/06/2024', 0, 'en-GB')).toBe('day')
    expect(getSegmentAtCaret('15/06/2024', 3, 'en-GB')).toBe('month')
    expect(getSegmentAtCaret('15/06/2024', 6, 'en-GB')).toBe('year')
  })

  it('treats a caret on a separator as the preceding numeric segment', () => {
    expect(getSegmentAtCaret('15/06/2024', 2, 'en-GB')).toBe('day')
  })

  it('carries day overflow with Gregorian constrain', () => {
    expect(stepDateSegment('2024-01-31', 'day', 1)).toBe('2024-02-01')
  })

  it('constrains month and year carry like Calendar', () => {
    expect(stepDateSegment('2024-01-31', 'month', 1)).toBe('2024-02-29')
    expect(stepDateSegment('2024-02-29', 'year', 1)).toBe('2025-02-28')
  })

  it('refuses to step outside years 0001-9999', () => {
    expect(stepDateSegment('9999-06-15', 'year', 1)).toBeNull()
  })
})

describe('parse-kit constraints', () => {
  it('flags out-of-range dates without coercing', () => {
    expect(isDateWithinConstraints('2024-06-15', '2024-06-01', '2024-06-30')).toBe(true)
    expect(isDateWithinConstraints('2024-05-31', '2024-06-01', '2024-06-30')).toBe(false)
    expect(isDateWithinConstraints('2024-07-01', '2024-06-01', '2024-06-30')).toBe(false)
  })

  it('applies isDateUnavailable the same way as min/max', () => {
    const unavailable = (d: string) => d === '2024-06-15'
    expect(isDateWithinConstraints('2024-06-15', undefined, undefined, unavailable)).toBe(false)
    expect(isDateWithinConstraints('2024-06-16', undefined, undefined, unavailable)).toBe(true)
  })

  it('throws loudly for min after max or non-canonical bounds', () => {
    expect(() => assertValidDateBounds('2024-06-30', '2024-06-01')).toThrow(
      '[reference-ui] DateField: "min" (2024-06-30) must not be after "max" (2024-06-01).'
    )
    expect(() => assertValidDateBounds('2024-6-1', undefined)).toThrow(
      '[reference-ui] DateField: "min" must be a canonical ISO date (YYYY-MM-DD)'
    )
    expect(() => assertValidDateBounds(undefined, '06/30/2024')).toThrow(
      '[reference-ui] DateField: "max" must be a canonical ISO date (YYYY-MM-DD)'
    )
    expect(() => assertValidDateBounds('2024-02-30', undefined)).toThrow(
      '"min" must be a canonical ISO date'
    )
  })

  it('accepts absent, open-ended, and equal bounds', () => {
    expect(() => assertValidDateBounds(undefined, undefined)).not.toThrow()
    expect(() => assertValidDateBounds('2024-06-01', undefined)).not.toThrow()
    expect(() => assertValidDateBounds(undefined, '2024-06-30')).not.toThrow()
    expect(() => assertValidDateBounds('2024-06-15', '2024-06-15')).not.toThrow()
  })
})
