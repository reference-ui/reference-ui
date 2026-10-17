/**
 * Availability: useAvailability wraps the bounds and the predicate into
 * the five stable callbacks the context carries — out-of-bounds days,
 * predicate-refused days, their merge, and the month/year disabled states
 * (a unit disables exactly when every day of it is unselectable, so
 * partial units stay enabled).
 */
import * as React from 'react'
import {
  formatISODate,
  formatISOMonth,
  getDaysInMonth,
  parseISODate,
  parseISOMonth,
  type ISOMonth,
  type ISOYear,
} from '../dates/iso'
import type { ISODate } from '../types'

export interface AvailabilityOptions {
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

export function useAvailability(options: AvailabilityOptions) {
  const { min, max, isDateUnavailable } = options

  // Out-of-bounds day state: outside the canonical bounds.
  // Natively disabled, keyboard-skipped, never the roving target.
  // Lexical comparison is exact here — bounds passed the CA-ISO-04
  // canonical gate and grid dates are canonical by construction.
  const isDateDisabled = React.useCallback(
    (dateStr: ISODate) => {
      if (min !== undefined && dateStr < min) return true
      if (max !== undefined && dateStr > max) return true
      return false
    },
    [min, max]
  )

  // Predicate-only unavailable state: refused by
  // `isDateUnavailable`, regardless of bounds. Focusable but
  // unselectable; the Grid intersects it with in-bounds for paint.
  const isDateUnavailableDay = React.useCallback(
    (dateStr: ISODate) => isDateUnavailable?.(dateStr) ?? false,
    [isDateUnavailable]
  )

  // Merged unselectable state: activation, month/year disabling, and
  // the Day `disabled` flag all read this.
  const isDateUnselectable = React.useCallback(
    (dateStr: ISODate) => isDateDisabled(dateStr) || isDateUnavailableDay(dateStr),
    [isDateDisabled, isDateUnavailableDay]
  )

  // Month/year non-interactive states (FEATURES #10): a unit is disabled
  // exactly when every day of it is unselectable, so partial months stay
  // enabled (CA-VIEW-04) and a unit flips only when its last day does
  // (CA-MODE-05). Whole units outside the bound months short-circuit
  // without scanning days; the predicate scan is inherent to the
  // CA-MODE-05 contract and memoized at the collection level.
  const isMonthDisabled = React.useCallback(
    (monthStr: ISOMonth) => {
      if (min !== undefined && monthStr < min.slice(0, 7)) return true
      if (max !== undefined && monthStr > max.slice(0, 7)) return true
      const { year: y, month: m } = parseISOMonth(monthStr)
      if (y < 1 || y > 9999) return true
      const days = getDaysInMonth(y, m)
      for (let day = 1; day <= days; day++) {
        if (!isDateUnselectable(formatISODate(y, m, day))) return false
      }
      return true
    },
    [min, max, isDateUnselectable]
  )

  const isYearDisabled = React.useCallback(
    (yearStr: ISOYear) => {
      const y = Number(yearStr)
      if (!Number.isInteger(y) || y < 1 || y > 9999) return true
      if (min !== undefined && y < parseISODate(min).year) return true
      if (max !== undefined && y > parseISODate(max).year) return true
      for (let m = 1; m <= 12; m++) {
        if (!isMonthDisabled(formatISOMonth(y, m))) return false
      }
      return true
    },
    [min, max, isMonthDisabled]
  )

  return {
    isDateDisabled,
    isDateUnavailableDay,
    isDateUnselectable,
    isMonthDisabled,
    isYearDisabled,
  }
}
