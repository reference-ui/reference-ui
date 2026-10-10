/**
 * Year window: resolveYearWindow seats the 21-year collection — ten either
 * side of the shown year unbounded (clamped to keep 21 in-domain at
 * 0001/9999); min-through-max years when both bounds exist; a 21-year run
 * reaching from the single bound toward the shown year otherwise.
 */
import { parseISODate } from '../dates/iso'
import type { ISODate } from '../types'

export function resolveYearWindow(
  year: number,
  min?: ISODate,
  max?: ISODate
): { startYear: number; endYear: number } {
  let startYear = year - 10
  let endYear = year + 10
  if (min || max) {
    if (min && max) {
      startYear = parseISODate(min).year
      endYear = parseISODate(max).year
    } else if (min) {
      startYear = parseISODate(min).year
      endYear = Math.max(startYear + 20, year + 10)
    } else if (max) {
      endYear = parseISODate(max).year
      startYear = Math.min(endYear - 20, year - 10)
    }
  } else {
    if (startYear < 1) {
      startYear = 1
      endYear = Math.min(9999, 21)
    } else if (endYear > 9999) {
      endYear = 9999
      startYear = Math.max(1, 9999 - 20)
    }
  }
  startYear = Math.max(1, startYear)
  endYear = Math.min(9999, endYear)
  return { startYear, endYear }
}
