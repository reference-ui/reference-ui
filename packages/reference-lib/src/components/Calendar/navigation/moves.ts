/**
 * Day-grid keyboard moves: skipToFocusable walks out-of-bounds dates to
 * the next landing without wrapping, resolveArrowTarget steps arrows
 * (a week vertically, RTL-aware horizontally), resolveHomeEndTarget lands
 * the locale week boundary skipping inward, and resolvePageTarget steps a
 * month preserving the day. Unavailable dates are landing spots, never
 * skipped; null means the gesture goes nowhere.
 */
import {
  addCalendarDays,
  formatISODate,
  getDayOfWeek,
  getDaysInMonth,
  parseISODate,
  type ISODate as CanonicalISODate,
} from '../dates/iso'
import { shiftMonth } from '../dates/pane'
import type { ISODate } from '../types'

export function skipToFocusable(
  candidate: ISODate,
  step: 1 | -1,
  minBound: ISODate,
  maxBound: ISODate,
  isDisabled: (date: ISODate) => boolean
): ISODate | null {
  let current = candidate
  for (let i = 0; i < 10000; i++) {
    if (current < minBound || current > maxBound) return null
    if (!isDisabled(current)) return current
    try {
      // Canonical by construction: the candidate entered validated and
      // every step preserves canonical form.
      current = addCalendarDays(current as CanonicalISODate, step)
    } catch {
      return null // Gregorian domain edge
    }
  }
  return null
}

export function resolveArrowTarget(
  origin: ISODate,
  key: string,
  rtl: boolean,
  minBound: ISODate,
  maxBound: ISODate,
  isDisabled: (date: ISODate) => boolean
): ISODate | null {
  const vertical = key === 'ArrowUp' || key === 'ArrowDown'
  const step =
    key === 'ArrowLeft'
      ? rtl
        ? 1
        : -1
      : key === 'ArrowRight'
        ? rtl
          ? -1
          : 1
        : key === 'ArrowUp'
          ? -1
          : 1
  const dirOrStep: 1 | -1 = step > 0 ? 1 : -1
  try {
    return skipToFocusable(
      addCalendarDays(origin as CanonicalISODate, vertical ? step * 7 : step),
      dirOrStep,
      minBound,
      maxBound,
      isDisabled
    )
  } catch {
    return null
  }
}

export function resolveHomeEndTarget(
  origin: ISODate,
  key: 'Home' | 'End',
  weekStart: number,
  isDisabled: (date: ISODate) => boolean
): ISODate | null {
  try {
    const { year, month, day } = parseISODate(origin)
    const dow = getDayOfWeek(year, month, day)
    const offset =
      key === 'Home' ? (dow - weekStart + 7) % 7 : (weekStart + 6 - dow + 7) % 7
    const inward: 1 | -1 = key === 'Home' ? 1 : -1
    // The origin is a rendered canonical date; steps preserve form.
    let current: ISODate = addCalendarDays(origin as CanonicalISODate, key === 'Home' ? -offset : offset)
    let candidate: ISODate | null = null
    for (let i = 0; i <= offset; i++) {
      if (!isDisabled(current)) {
        candidate = current
        break
      }
      if (current === origin) break
      current = addCalendarDays(current as CanonicalISODate, inward)
    }
    return candidate
  } catch {
    return null
  }
}

export function resolvePageTarget(
  origin: ISODate,
  direction: -1 | 1,
  minBound: ISODate,
  maxBound: ISODate,
  isDisabled: (date: ISODate) => boolean
): ISODate | null {
  const { year, month, day } = parseISODate(origin)
  const targetMonth = shiftMonth(year, month - 1, direction)
  if (targetMonth) {
    const clampedDay = Math.min(day, getDaysInMonth(targetMonth.year, targetMonth.month + 1))
    return skipToFocusable(
      formatISODate(targetMonth.year, targetMonth.month + 1, clampedDay),
      direction,
      minBound,
      maxBound,
      isDisabled
    )
  }
  return null
}
