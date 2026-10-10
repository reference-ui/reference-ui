/**
 * Roving tab targets: computePreferredTarget ranks the in-bounds rendered
 * selection, then in-bounds rendered today, then the first in-bounds
 * in-month day, then the first in-bounds rendered day — null when nothing
 * is in bounds, so no artificial tab stop. nearestFocusableTarget
 * relocates a lost target forward-first. Unavailable days are in-bounds
 * and fully participate.
 */
import type { GridDay } from '../dates/grid'
import type { ISODate } from '../types'

export function computePreferredTarget(
  renderedDays: GridDay[],
  isDisabled: (date: ISODate) => boolean,
  isSelected: (date: ISODate) => boolean,
  markerToday: ISODate | null
): ISODate | null {
  const enabledSelected = renderedDays.find(
    (cell) => !isDisabled(cell.date) && isSelected(cell.date)
  )
  if (enabledSelected) return enabledSelected.date
  const renderedSet = new Set<string>(renderedDays.map((cell) => cell.date))
  if (markerToday && renderedSet.has(markerToday) && !isDisabled(markerToday)) {
    return markerToday
  }
  const firstInMonth = renderedDays.find(
    (cell) => !cell.outsideMonth && !isDisabled(cell.date)
  )
  if (firstInMonth) return firstInMonth.date
  return renderedDays.find((cell) => !isDisabled(cell.date))?.date ?? null
}

export function nearestFocusableTarget(
  renderedDays: GridDay[],
  origin: ISODate | null,
  isDisabled: (date: ISODate) => boolean
): ISODate | null {
  const originIndex = origin ? renderedDays.findIndex((cell) => cell.date === origin) : -1
  const scan = (from: number, step: 1 | -1): ISODate | null => {
    for (let i = from; i >= 0 && i < renderedDays.length; i += step) {
      if (!isDisabled(renderedDays[i].date)) return renderedDays[i].date
    }
    return null
  }
  if (originIndex >= 0) {
    return scan(originIndex + 1, 1) ?? scan(originIndex - 1, -1)
  }
  return scan(0, 1)
}
