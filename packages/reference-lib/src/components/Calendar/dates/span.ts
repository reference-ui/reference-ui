/**
 * Blocked-span scan: rangeSpanHasBlockedDate walks the inclusive canonical
 * span day by day and reports whether any date refuses selection. Range
 * completion and preview validity both read it, so a span crossing an
 * unselectable date never paints and never emits. Ascends lexically and
 * fails closed at the Gregorian domain edge.
 */
import { addCalendarDays, type CanonicalISODate } from './iso'
import type { ISODate } from '../types'

export function rangeSpanHasBlockedDate(
  low: ISODate,
  high: ISODate,
  isUnselectable: (date: ISODate) => boolean
): boolean {
  let current = low
  for (;;) {
    if (isUnselectable(current)) return true
    if (current >= high) return false
    try {
      current = addCalendarDays(current as CanonicalISODate, 1)
    } catch {
      return true
    }
  }
}
