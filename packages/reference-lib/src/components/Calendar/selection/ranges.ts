/**
 * Range completion machine: resolveRangeSelect folds one activation into
 * the controlled range — a fresh pending start, a backward completion, or
 * a forward completion. A completion whose inclusive span crosses an
 * unselectable date is rejected (the pending start is retained, never
 * reset), and an identical value emits nothing. Null means rejected.
 */
import { rangeSpanHasBlockedDate } from '../dates/span'
import type { DateRangeValue, ISODate } from '../types'

export function resolveRangeSelect(
  curr: DateRangeValue | null,
  dateStr: ISODate,
  isUnselectable: (date: ISODate) => boolean
): DateRangeValue | null {
  let nextRange: DateRangeValue
  if (!curr || !curr.start || (curr.start && curr.end)) {
    nextRange = { start: dateStr, end: null }
  } else if (dateStr < curr.start) {
    nextRange = { start: dateStr, end: curr.start }
  } else {
    nextRange = { start: curr.start, end: dateStr }
  }
  // A completion whose inclusive span crosses an unselectable date
  // is rejected with the pending start retained (CA-RANGE-07) —
  // deliberately kept, never reset to the endpoint. Fresh pending
  // starts (end null) skip the scan.
  if (nextRange.end != null) {
    const low = nextRange.start < nextRange.end ? nextRange.start : nextRange.end
    const high = nextRange.start < nextRange.end ? nextRange.end : nextRange.start
    if (rangeSpanHasBlockedDate(low, high, isUnselectable)) return null
  }
  if (
    !curr ||
    nextRange.start !== curr.start ||
    (nextRange.end ?? null) !== (curr.end ?? null)
  ) {
    return nextRange
  }
  return null
}
