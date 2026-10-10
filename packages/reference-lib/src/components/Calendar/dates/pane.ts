/**
 * Pane seating: shiftMonth steps to an adjacent month (or null past the
 * 0001–9999 edge), getHomeView names the mode's home collection,
 * monthFromValue seats the pane on a value's month, and systemMonth reads
 * the current UTC month as the last-resort seed. The pane hook composes
 * these; none of them touch React.
 */
import {
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
  parseISODate,
  parseISOMonth,
} from './iso'
import type { CalendarMode, CalendarView, CalendarValue } from '../types'

export function getHomeView(mode: CalendarMode): CalendarView {
  if (mode === 'month') return 'month'
  if (mode === 'year') return 'year'
  return 'day'
}

export function shiftMonth(
  year: number,
  month0: number,
  delta: -1 | 1
): { year: number; month: number } | null {
  let nextY = year
  let nextM = month0 + delta
  if (nextM < 0) {
    nextM = 11
    nextY -= 1
  } else if (nextM > 11) {
    nextM = 0
    nextY += 1
  }
  if (nextY < 1 || nextY > 9999) return null
  return { year: nextY, month: nextM }
}

export function monthFromValue(value: CalendarValue): { year: number; month: number } | null {
  if (typeof value === 'string') {
    if (isValidISODate(value)) {
      const { year, month } = parseISODate(value)
      return { year, month: month - 1 }
    }
    if (isValidISOMonth(value)) {
      const { year, month } = parseISOMonth(value)
      return { year, month: month - 1 }
    }
    if (isValidISOYear(value)) {
      return { year: Number(value), month: 0 }
    }
    return null
  }
  if (value && typeof value === 'object' && 'start' in value && isValidISODate(value.start)) {
    const { year, month } = parseISODate(value.start)
    return { year, month: month - 1 }
  }
  return null
}

export function systemMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() }
}
