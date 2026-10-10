/**
 * Collection range paint: monthRangePaint and yearRangePaint mark one
 * month or year cell selected/start/end/in-range from the committed
 * value. Completed ranges mark inclusively, a pending start marks itself
 * alone, and hovering never invents day-grid preview attributes — there
 * is no preview machine on these branches.
 */
import { isValidISODate, parseISODate, type ISOMonth } from '../dates/iso'
import type { CalendarValue, DateRangeValue } from '../types'

export interface CollectionRangePaint {
  selected: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

const emptyPaint = (): CollectionRangePaint => ({
  selected: false,
  rangeStart: false,
  rangeEnd: false,
  inRange: false,
})

export function monthRangePaint(month: ISOMonth, value: CalendarValue): CollectionRangePaint {
  const empty = emptyPaint()
  if (!value || typeof value !== 'object' || !('start' in value)) return empty
  const range = value as DateRangeValue
  if (!isValidISODate(range.start)) return empty
  const startM = range.start.slice(0, 7)
  if (range.end != null && isValidISODate(range.end)) {
    const endM = range.end.slice(0, 7)
    const inRange = month >= startM && month <= endM
    return {
      selected: inRange,
      rangeStart: month === startM,
      rangeEnd: month === endM,
      inRange,
    }
  }
  const isStart = month === startM
  return { selected: isStart, rangeStart: isStart, rangeEnd: false, inRange: false }
}

export function yearRangePaint(yearNum: number, value: CalendarValue): CollectionRangePaint {
  const empty = emptyPaint()
  if (!value || typeof value !== 'object' || !('start' in value)) return empty
  const range = value as DateRangeValue
  if (!isValidISODate(range.start)) return empty
  const startY = parseISODate(range.start).year
  if (range.end != null && isValidISODate(range.end)) {
    const endY = parseISODate(range.end).year
    const inRange = yearNum >= startY && yearNum <= endY
    return {
      selected: inRange,
      rangeStart: yearNum === startY,
      rangeEnd: yearNum === endY,
      inRange,
    }
  }
  const isStart = yearNum === startY
  return { selected: isStart, rangeStart: isStart, rangeEnd: false, inRange: false }
}
