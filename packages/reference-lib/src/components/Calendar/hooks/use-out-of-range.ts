/**
 * Out-of-range controlled value (dev diagnostic only): a value outside
 * min/max keeps its paint and selected state, because the controlled value
 * really is that date; only its cell is disabled, so render and ARIA agree.
 * useOutOfRangeWarning names that state once per distinct value through the
 * Calendar channel. Only min/max count: the isDateUnavailable predicate never
 * makes a value out of range, and each unit compares at its own width.
 */
import * as React from 'react'
import { calendarDevDiagnostic } from '../shared/diagnostic'
import type { CalendarMode, CalendarValue, DateRangeValue, ISODate } from '../types'

export interface OutOfRangeOptions {
  mode: CalendarMode
  value: CalendarValue
  min?: ISODate
  max?: ISODate
  /** validateCalendarProps' message: an invalid prop set already diagnosed
   * itself, so this warning stays silent beside it. */
  invalid: string | null
}

export function useOutOfRangeWarning({ mode, value, min, max, invalid }: OutOfRangeOptions) {
  // Primitive parts key the effect: a fresh range object each render must not
  // re-warn, while a changed endpoint or bound must. Scalar modes carry their
  // one value in `start`.
  const range = mode === 'range' ? (value as DateRangeValue | null) : null
  const start = mode === 'range' ? (range?.start ?? null) : (value as ISODate | null)
  const end = range?.end ?? null

  React.useEffect(() => {
    if (invalid) return
    for (const message of outOfRangeMessages({ mode, start, end, min, max })) {
      calendarDevDiagnostic(message)
    }
  }, [invalid, mode, start, end, min, max])
}

export interface OutOfRangeInput {
  mode: CalendarMode
  start: string | null
  end: string | null
  min: ISODate | undefined
  max: ISODate | undefined
}

/** One line per offending part: range mode checks start and end separately,
 * scalar modes check their one value, and a null part never warns. */
export function outOfRangeMessages({ mode, start, end, min, max }: OutOfRangeInput): string[] {
  const parts: Array<[string, string | null]> =
    mode === 'range' ? [['value.start', start], ['value.end', end]] : [['value', start]]
  const bounds = `[${min ?? '-∞'}, ${max ?? '+∞'}]`
  return parts.flatMap(([label, date]) =>
    date !== null && isOutsideBounds(mode, date, min, max)
      ? [`${label} (${date}) is outside ${bounds}; it stays selected but is disabled.`]
      : []
  )
}

/** Mirrors the min/max halves of isDateDisabled, isMonthDisabled and
 * isYearDisabled without their predicate scan. A month or year that only
 * partly overlaps the bounds is in range, as its partial cells stay enabled. */
function isOutsideBounds(mode: CalendarMode, unit: string, min?: ISODate, max?: ISODate): boolean {
  const width = mode === 'month' ? 7 : mode === 'year' ? 4 : 10
  if (min !== undefined && unit < min.slice(0, width)) return true
  return max !== undefined && unit > max.slice(0, width)
}
