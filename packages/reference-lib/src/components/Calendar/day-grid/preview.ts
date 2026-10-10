/**
 * Range preview band: resolvePreviewBand validates the hover/focus
 * candidate against the controlled pending start — range mode, pending
 * value, a candidate that is not the start, selectable, and whose
 * inclusive span holds no unselectable date. Anything else previews
 * nothing. The band is anchor-oriented: the start keeps range-start, the
 * candidate takes range-end, and completion normalizes to chronological.
 */
import { rangeSpanHasBlockedDate } from '../dates/span'
import type { CalendarMode, CalendarValue, DateRangeValue, ISODate } from '../types'

export interface PreviewBand {
  low: ISODate
  high: ISODate
  start: ISODate
  candidate: ISODate
}

export function resolvePreviewBand(
  mode: CalendarMode,
  value: CalendarValue,
  candidate: ISODate | null,
  isUnselectable: (date: ISODate) => boolean
): PreviewBand | null {
  if (mode !== 'range' || !value || typeof value !== 'object') return null
  const range = value as DateRangeValue
  if (!range.start || range.end != null) return null
  if (!candidate || candidate === range.start) return null
  if (isUnselectable(candidate)) return null
  const low = range.start < candidate ? range.start : candidate
  const high = range.start < candidate ? candidate : range.start
  if (rangeSpanHasBlockedDate(low, high, isUnselectable)) return null
  return { low, high, start: range.start, candidate }
}
