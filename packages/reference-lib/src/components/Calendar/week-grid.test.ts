import { describe, expect, it } from 'vitest'
import {
  type ISOMonth,
  buildMonthGrid,
  getDayOfWeek,
  getDaysInMonth,
  getWeekStart,
  getWeekdayHeaders,
  parseISODate,
  validateLocale,
} from './index'

// Ported from quarantine b19c73bee matrix unit suite (import path only:
// '@reference-ui/lib' -> './index', proving the curated public kit export).
describe('Calendar week-start and month grid', () => {
  it('CA-LOC-01: Calendar should derive Sunday-first US weeks and Monday-first British weeks from the required locale', () => {
    // Week containing 2024-08-14 (Wednesday)
    const usStart = getWeekStart('en-US')
    expect(usStart).toBe(0) // Sunday

    const gbStart = getWeekStart('en-GB')
    expect(gbStart).toBe(1) // Monday

    // Grid row construction for August 2024
    const usGrid = buildMonthGrid('2024-08', usStart, 'en-US')
    // 2024-08-01 was Thursday. In Sunday-first, leading days are Sun(28), Mon(29), Tue(30), Wed(31)
    expect(usGrid.weeks[0][0].date).toBe('2024-07-28') // Sunday
    expect(usGrid.weeks[0][6].date).toBe('2024-08-03') // Saturday

    const gbGrid = buildMonthGrid('2024-08', gbStart, 'en-GB')
    // In Monday-first, leading days are Mon(29), Tue(30), Wed(31)
    expect(gbGrid.weeks[0][0].date).toBe('2024-07-29') // Monday
    expect(gbGrid.weeks[0][6].date).toBe('2024-08-04') // Sunday
  })

  it('CA-LOC-02: Calendar should support a locale whose week begins on Saturday', () => {
    // ar-AF week starts on Saturday (index 6)
    const afStart = getWeekStart('ar-AF')
    expect(afStart).toBe(6)

    const headers = getWeekdayHeaders('ar-AF', afStart)
    expect(headers[0].weekday).toBe(6) // Saturday
    expect(headers[6].weekday).toBe(5) // Friday
  })

  it('CA-LOC-03: Calendar should resolve locale extensions, language-only subtags, and valid unsupported locales through the same Intl negotiation path', () => {
    // Explicit fw extension overrides region
    expect(getWeekStart('en-US-u-fw-mon')).toBe(1)
    expect(getWeekStart('en-US-u-fw-tue')).toBe(2)

    // Language only subtag 'fr'
    const frStart = getWeekStart('fr')
    expect(frStart).toBe(1) // Monday

    // Unsupported/mock locale does not crash and gives deterministic start
    const fallbackStart = getWeekStart('zz-ZZ')
    expect(typeof fallbackStart).toBe('number')
  })

  it('CA-LOC-08: Calendar should force Gregorian labels for a locale with another default calendar and reject an explicit non-Gregorian calendar request', () => {
    // Plain ar-SA preserves Arabic and resolves Gregorian headers safely
    const headers = getWeekdayHeaders('ar-SA', 6)
    expect(headers.length).toBe(7)

    // Explicit non-Gregorian calendar request throws diagnostic
    expect(() => validateLocale('ar-SA-u-ca-islamic')).toThrow(
      /Calendar does not support non-Gregorian calendar/
    )
  })

  it('CA-GRID-01: Calendar should generate only complete seven-day weeks that fully cover the controlled month', () => {
    // Monday-first February 2021 (Feb 1 was Monday, 28 days -> 4 weeks = 28 cells)
    const feb2021 = buildMonthGrid('2021-02', 1, 'en-GB')
    expect(feb2021.weeks.length).toBe(4)
    expect(feb2021.allDays.length).toBe(28)
    for (const week of feb2021.weeks) {
      expect(week.length).toBe(7)
    }

    // Sunday-first August 2021 (Aug 1 was Sunday, 31 days -> 5 weeks = 35 cells)
    const aug2021 = buildMonthGrid('2021-08', 0, 'en-US')
    expect(aug2021.weeks.length).toBe(5)
    expect(aug2021.allDays.length).toBe(35)

    // Sunday-first May 2021 (May 1 was Saturday, 31 days -> 6 weeks = 42 cells)
    const may2021 = buildMonthGrid('2021-05', 0, 'en-US')
    expect(may2021.weeks.length).toBe(6)
    expect(may2021.allDays.length).toBe(42)
  })

  it('CA-GRID-02: Calendar padding should align to the locale week boundary for every possible month edge', () => {
    // Check Sunday-first (0), Monday-first (1), Saturday-first (6)
    for (const weekStart of [0, 1, 6]) {
      const grid = buildMonthGrid('2024-04', weekStart, 'en-US')
      const firstDay = grid.allDays[0]
      const lastDay = grid.allDays[grid.allDays.length - 1]

      const firstParsed = parseISODate(firstDay.date)
      const firstDow = getDayOfWeek(firstParsed.year, firstParsed.month, firstParsed.day)
      expect(firstDow).toBe(weekStart)

      const lastParsed = parseISODate(lastDay.date)
      const lastDow = getDayOfWeek(lastParsed.year, lastParsed.month, lastParsed.day)
      expect(lastDow).toBe((weekStart + 6) % 7)
    }
  })

  it('CA-GRID-03: Calendar should include every Gregorian day of the visible month exactly once across all month lengths', () => {
    const months = [
      { m: '1900-02' as ISOMonth, days: 28 }, // 1900 not leap
      { m: '2000-02' as ISOMonth, days: 29 }, // 2000 leap
      { m: '2023-02' as ISOMonth, days: 28 }, // 2023 not leap
      { m: '2024-02' as ISOMonth, days: 29 }, // 2024 leap
      { m: '2024-04' as ISOMonth, days: 30 }, // April 30
      { m: '2024-01' as ISOMonth, days: 31 }, // January 31
    ]

    for (const { m, days } of months) {
      const grid = buildMonthGrid(m, 1, 'en-GB')
      const inMonth = grid.allDays.filter((d) => !d.outsideMonth)
      expect(inMonth.length).toBe(days)

      // Ensure each day is unique and in sequential order
      const dayNumbers = inMonth.map((d) => d.day)
      const expectedNumbers = Array.from({ length: days }, (_, i) => i + 1)
      expect(dayNumbers).toEqual(expectedNumbers)
    }
  })

  it('grid kernels match Date.UTC across 1900-2100 (Calendar.tsx wire safety)', () => {
    // getDayOfWeek (Sakamoto) and getDaysInMonth must agree with the legacy
    // Date.UTC math they replaced for every in-domain year the UI can show.
    for (let year = 1900; year <= 2100; year++) {
      for (let month = 1; month <= 12; month++) {
        expect(getDayOfWeek(year, month, 1)).toBe(
          new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
        )
        expect(getDaysInMonth(year, month)).toBe(
          new Date(Date.UTC(year, month, 0)).getUTCDate()
        )
      }
    }
  })
})
