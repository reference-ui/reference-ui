/**
 * Committed selection matching: six pure predicates over (mode, value,
 * date) answering selected, inclusive-selected, interior-only in-range,
 * inclusive in-range, range-start, and range-end. Completed ranges
 * normalize to chronological, so a reversed controlled value still
 * paints its band; preview-only dates stay false everywhere. The root
 * wraps these in stable callbacks for the context.
 */
import type { CalendarMode, CalendarValue, DateRangeValue, ISODate } from '../types'

export function matchSelected(mode: CalendarMode, value: CalendarValue, dateStr: ISODate): boolean {
  if (mode === 'day') {
    return value === dateStr
  }
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    return range.start === dateStr || range.end === dateStr
  }
  return false
}

export function matchSelectedInclusive(
  mode: CalendarMode,
  value: CalendarValue,
  dateStr: ISODate
): boolean {
  if (mode === 'day') {
    return value === dateStr
  }
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    if (range.start && range.end) {
      const low = range.start < range.end ? range.start : range.end
      const high = range.start < range.end ? range.end : range.start
      return dateStr >= low && dateStr <= high
    }
    return range.start === dateStr
  }
  return false
}

export function matchInRange(mode: CalendarMode, value: CalendarValue, dateStr: ISODate): boolean {
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    if (range.start && range.end) {
      return dateStr > range.start && dateStr < range.end
    }
  }
  return false
}

export function matchInRangeInclusive(
  mode: CalendarMode,
  value: CalendarValue,
  dateStr: ISODate
): boolean {
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    if (range.start && range.end) {
      const low = range.start < range.end ? range.start : range.end
      const high = range.start < range.end ? range.end : range.start
      return dateStr >= low && dateStr <= high
    }
  }
  return false
}

export function matchRangeStart(
  mode: CalendarMode,
  value: CalendarValue,
  dateStr: ISODate
): boolean {
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    return range.start === dateStr
  }
  return false
}

export function matchRangeEnd(mode: CalendarMode, value: CalendarValue, dateStr: ISODate): boolean {
  if (mode === 'range' && value && typeof value === 'object') {
    const range = value as DateRangeValue
    return range.end === dateStr
  }
  return false
}
