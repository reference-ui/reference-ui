import {
  type ISODate,
  type ISOMonth,
  formatISODate,
  getDaysInMonth,
  getDayOfWeek,
  parseISOMonth,
  isLeapYear,
} from './iso'
import { validateLocale } from './week'

export interface GridDay {
  date: ISODate
  year: number
  month: number
  day: number
  outsideMonth: boolean
  formattedDay: string
  accessibleName: string
}

export interface MonthGrid {
  year: number
  month: number
  weeks: GridDay[][]
  allDays: GridDay[]
}

// Date.UTC maps years 0..99 onto 19xx, which would corrupt the weekday in
// accessible labels for years 1..99 (CA-ISO-08: accepted years keep
// Gregorian Intl labels). Build from a leap base year, then restore the
// true proleptic-Gregorian year. Feb 29 can only name a leap year here
// because the grid contains only real days, so the base never rolls.
function utcDateForLabel(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(2000, month - 1, day))
  date.setUTCFullYear(year)
  return date
}

export function buildMonthGrid(
  monthStr: ISOMonth,
  firstDayOfWeek: number,
  locale: string
): MonthGrid {
  validateLocale(locale)
  const { year, month } = parseISOMonth(monthStr)
  const safeLocale = locale.includes('-u-ca-') ? locale : `${locale}-u-ca-gregory`

  const dayNumberFormatter = new Intl.DateTimeFormat(safeLocale, {
    day: 'numeric',
    timeZone: 'UTC',
  })
  const accessibleFormatter = new Intl.DateTimeFormat(safeLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  const daysInCurrentMonth = getDaysInMonth(year, month)
  const firstDayOfMonthWeekDay = getDayOfWeek(year, month, 1)

  // Leading days
  const leadingCount = (firstDayOfMonthWeekDay - firstDayOfWeek + 7) % 7

  const totalFilled = leadingCount + daysInCurrentMonth
  const rowCount = Math.ceil(totalFilled / 7)
  const totalCells = rowCount * 7
  const trailingCount = totalCells - totalFilled

  const allDays: GridDay[] = []

  // 1. Leading outside days
  if (leadingCount > 0) {
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth)
    for (let i = leadingCount - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const date = formatISODate(prevYear, prevMonth, day)
      const dateObj = utcDateForLabel(prevYear, prevMonth, day)
      allDays.push({
        date,
        year: prevYear,
        month: prevMonth,
        day,
        outsideMonth: true,
        formattedDay: dayNumberFormatter.format(dateObj),
        accessibleName: accessibleFormatter.format(dateObj),
      })
    }
  }

  // 2. In-month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = formatISODate(year, month, day)
    const dateObj = utcDateForLabel(year, month, day)
    allDays.push({
      date,
      year,
      month,
      day,
      outsideMonth: false,
      formattedDay: dayNumberFormatter.format(dateObj),
      accessibleName: accessibleFormatter.format(dateObj),
    })
  }

  // 3. Trailing outside days
  if (trailingCount > 0) {
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    for (let day = 1; day <= trailingCount; day++) {
      const date = formatISODate(nextYear, nextMonth, day)
      const dateObj = utcDateForLabel(nextYear, nextMonth, day)
      allDays.push({
        date,
        year: nextYear,
        month: nextMonth,
        day,
        outsideMonth: true,
        formattedDay: dayNumberFormatter.format(dateObj),
        accessibleName: accessibleFormatter.format(dateObj),
      })
    }
  }

  // Group into weeks of 7
  const weeks: GridDay[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  return {
    year,
    month,
    weeks,
    allDays,
  }
}
