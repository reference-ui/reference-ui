import { describe, expect, it } from 'vitest'
import type { ISODate as ISODateCanonical } from './iso'
import {
  type ISOMonth,
  type ISOYear,
  type CalendarDateRange,
  addCalendarDays,
  addCalendarMonths,
  calendarMonth,
  startOfCalendarMonth,
  endOfCalendarMonth,
  startOfCalendarYear,
  endOfCalendarYear,
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
  parseISODate,
  parseISOMonth,
  parseISOYear,
  formatISODate,
  formatISOMonth,
  formatISOYear,
  compareISODate,
  normalizeDateRange,
  getDayOfWeek,
} from './index'

// Ported from quarantine b19c73bee matrix unit suite (import path only:
// '@reference-ui/lib' -> './index', proving the curated public kit export).
// Skipped here by triage: CA-ISO-06/07 (fail-closed render-'').
describe('Calendar ISO kit', () => {
  it('CA-ISO-01: Calendar should accept only canonical, possible Gregorian ISO dates', () => {
    // Valid dates round-trip byte-for-byte
    expect(parseISODate('0001-01-01')).toEqual({ year: 1, month: 1, day: 1 })
    expect(formatISODate(1, 1, 1)).toBe('0001-01-01')

    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
    expect(formatISODate(2024, 2, 29)).toBe('2024-02-29')

    expect(parseISODate('9999-12-31')).toEqual({ year: 9999, month: 12, day: 31 })
    expect(formatISODate(9999, 12, 31)).toBe('9999-12-31')

    // Invalid dates fail validation
    const invalidDates = [
      '2023-02-29', // not a leap year
      '2024-00-10', // month 0
      '2024-13-10', // month 13
      '2024-04-31', // April has 30 days
      '2024-01-00', // day 0
      '2024-2-9', // unpadded month and day
      '2024-02', // missing day
      ' 2024-02-29 ', // whitespace
      '2024-02-29T00:00:00Z', // time suffix
      '2024-02-29+00:00', // offset
      '2024-02-29[UTC]', // zone annotation
    ]

    for (const d of invalidDates) {
      expect(isValidISODate(d)).toBe(false)
      expect(() => parseISODate(d)).toThrow(/Invalid ISO calendar date/)
    }
  })

  it('CA-ISO-02: Calendar day arithmetic should cross Gregorian month, year, and leap boundaries without local-time rollover', () => {
    // Millennium boundary
    expect(addCalendarDays('1999-12-31', 1)).toBe('2000-01-01')
    expect(addCalendarDays('2000-01-01', -1)).toBe('1999-12-31')

    // Non-leap February
    expect(addCalendarDays('2023-02-28', 1)).toBe('2023-03-01')
    expect(addCalendarDays('2023-03-01', -1)).toBe('2023-02-28')

    // Leap February
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addCalendarDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addCalendarDays('2024-03-01', -1)).toBe('2024-02-29')
    expect(addCalendarDays('2024-02-29', -1)).toBe('2024-02-28')

    // Century non-leap year (1900 is not leap)
    expect(addCalendarDays('1900-02-28', 1)).toBe('1900-03-01')
    expect(addCalendarDays('1900-03-01', -1)).toBe('1900-02-28')

    // Bounded domain checks
    expect(() => addCalendarDays('0001-01-01', -1)).toThrow(/underflow/)
    expect(() => addCalendarDays('9999-12-31', 1)).toThrow(/overflow/)
  })

  it('CA-ISO-03: Calendar month arithmetic should constrain the day to the target Gregorian month while preserving valid year changes', () => {
    const orig = '2023-01-31'
    expect(addCalendarMonths(orig, 1)).toBe('2023-02-28')
    expect(orig).toBe('2023-01-31') // source not mutated

    expect(addCalendarMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addCalendarMonths('2024-03-31', -1)).toBe('2024-02-29')
    expect(addCalendarMonths('2024-12-31', 1)).toBe('2025-01-31')

    // Bounded year overflow/underflow
    expect(() => addCalendarMonths('0001-01-15', -1)).toThrow(/underflow/)
    expect(() => addCalendarMonths('9999-12-15', 1)).toThrow(/overflow/)

    // ISOMonth addition
    expect(addCalendarMonths('2024-01' as ISOMonth, 1)).toBe('2024-02')
    expect(addCalendarMonths('2024-12' as ISOMonth, 1)).toBe('2025-01')
  })

  it('CA-ISO-04: Calendar should compare and normalize dates only after canonical validation', () => {
    const dates: ISODateCanonical[] = [
      '2024-02-29',
      '0001-01-01',
      '9999-12-31',
      '2023-12-31',
      '2024-01-01',
    ]
    const sorted = [...dates].sort(compareISODate)
    expect(sorted).toEqual([
      '0001-01-01',
      '2023-12-31',
      '2024-01-01',
      '2024-02-29',
      '9999-12-31',
    ])

    // Range normalization
    const reversed: CalendarDateRange = {
      start: '2024-04-15' as ISODateCanonical,
      end: '2024-04-10' as ISODateCanonical,
    }
    const normalized = normalizeDateRange(reversed)
    expect(normalized).toEqual({
      start: '2024-04-10',
      end: '2024-04-15',
    })

    // Compare with invalid input stops immediately
    expect(() => compareISODate('2024-02-30' as any, '2024-03-01')).toThrow(
      /Cannot compare invalid ISO dates/
    )
  })

  it('CA-ISO-05: Calendar ISO arithmetic should produce identical dates in every timezone and across daylight-saving transitions', () => {
    // 2024 spring-forward US was 2024-03-10, fall-back was 2024-11-03
    const springAdd = addCalendarDays('2024-03-09', 2)
    expect(springAdd).toBe('2024-03-11')

    const fallAdd = addCalendarDays('2024-11-02', 2)
    expect(fallAdd).toBe('2024-11-04')

    // Leap boundary add
    const leapAdd = addCalendarDays('2024-02-28', 1)
    expect(leapAdd).toBe('2024-02-29')
  })
  it('CA-ISO-08: Calendar should keep all Gregorian values inside the four-digit 0001–9999 domain', () => {
    // Valid 4-digit years
    expect(isValidISODate('0001-01-01')).toBe(true)
    expect(isValidISODate('0099-05-15')).toBe(true)
    expect(isValidISODate('0100-01-01')).toBe(true)
    expect(isValidISODate('9999-12-31')).toBe(true)

    // Invalid years outside 0001..9999
    expect(isValidISODate('0000-01-01')).toBe(false)
    expect(isValidISODate('-0001-01-01')).toBe(false)
    expect(isValidISODate('+0001-01-01')).toBe(false)
    expect(isValidISODate('10000-01-01')).toBe(false)
    expect(isValidISOMonth('10000-01')).toBe(false)
    expect(isValidISOYear('10000')).toBe(false)
  })
  it('CA-UTIL-01: Public ISO helpers should match the Calendar arithmetic gate', () => {
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addCalendarMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addCalendarMonths('2024-01' as ISOMonth, 1)).toBe('2024-02')
    expect(startOfCalendarMonth('2024-02-15')).toBe('2024-02-01')
    expect(endOfCalendarMonth('2024-02-15')).toBe('2024-02-29')
    expect(startOfCalendarYear('2024-02-15')).toBe('2024-01-01')
    expect(endOfCalendarYear('2024-02-15')).toBe('2024-12-31')
    expect(calendarMonth('2024-09-18')).toBe('2024-09')
    expect(calendarMonth('2024-09' as ISOMonth)).toBe('2024-09')
    expect(calendarMonth('2024' as ISOYear)).toBe('2024-01')

    expect(() => addCalendarDays('invalid-date' as any, 1)).toThrow(
      /Invalid ISO calendar date/
    )
    expect(() => addCalendarMonths('invalid-date' as any, 1)).toThrow(
      /Invalid ISO date or month/
    )
  })
})
