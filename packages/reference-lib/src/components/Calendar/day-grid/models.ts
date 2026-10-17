/**
 * Resolved per-date models: resolveDayModels computes the exact ten-field
 * render state plus the DOM/paint derivations once per date, so Days (td
 * paint) and Day (button props) can never disagree. Custom Day content
 * replaces only the button's children; nullish keeps the locale number.
 */
import type { DayCellModel } from '../context'
import type { GridDay } from '../dates/grid'
import type {
  CalendarDayRenderer,
  CalendarDayState,
  CalendarView,
  ISODate,
} from '../types'
import type { PreviewBand } from './preview'

export interface DayModelInputs {
  renderedDays: GridDay[]
  isSelected: (date: ISODate) => boolean
  isSelectedInclusive: (date: ISODate) => boolean
  isInRange: (date: ISODate) => boolean
  isInRangeInclusive: (date: ISODate) => boolean
  isRangeStart: (date: ISODate) => boolean
  isRangeEnd: (date: ISODate) => boolean
  isDisabled: (date: ISODate) => boolean
  isUnavailableDay: (date: ISODate) => boolean
  previewBand: PreviewBand | null
  markerToday: ISODate | null
  focusedDate: ISODate | null
  dayRender?: CalendarDayRenderer
  view: CalendarView
  idPrefix: string
}

export function resolveDayModels(inputs: DayModelInputs): Map<ISODate, DayCellModel> {
  const {
    renderedDays,
    isSelected,
    isSelectedInclusive,
    isInRange,
    isInRangeInclusive,
    isRangeStart,
    isRangeEnd,
    isDisabled,
    isUnavailableDay,
    previewBand,
    markerToday,
    focusedDate,
    dayRender,
    view,
    idPrefix,
  } = inputs
  const models = new Map<ISODate, DayCellModel>()
  for (const cell of renderedDays) {
    const date = cell.date
    const selected = isSelected(date)
    const selectedInclusive = isSelectedInclusive(date)
    const inBand = previewBand !== null && date >= previewBand.low && date <= previewBand.high
    const rangeStart = isRangeStart(date)
    const rangeEnd = isRangeEnd(date) || previewBand?.candidate === date
    const disabled = isDisabled(date)
    // Unavailable is the focusable half of unselectable:
    // out-of-bounds already implies it, so the flag marks only
    // the in-bounds predicate-refused dates.
    const unavailable = !disabled && isUnavailableDay(date)
    const unselectable = disabled || unavailable
    const isToday = markerToday === date
    const isFocused = focusedDate === date
    // Custom content replaces only the button's children;
    // nullish keeps the default locale day number.
    const defaultContent =
      dayRender?.(date, {
        selected,
        inRange: isInRange(date),
        disabled: unselectable,
        today: isToday,
      }) ?? cell.formattedDay
    const inRangeInclusive = isInRangeInclusive(date) || inBand
    const renderState: CalendarDayState = {
      date,
      formattedDay: cell.formattedDay,
      outsideMonth: cell.outsideMonth,
      today: isToday,
      selected: selectedInclusive,
      disabled: unselectable,
      rangeStart,
      rangeEnd,
      inRange: inRangeInclusive,
      preview: inBand,
    }
    models.set(date, {
      cell,
      renderState,
      selected,
      selectedInclusive,
      inRangeInclusive,
      paintInRange:
        isInRange(date) ||
        (previewBand !== null && date > previewBand.low && date < previewBand.high),
      rangeStart,
      rangeEnd,
      disabled,
      unavailable,
      unselectable,
      isToday,
      isFocused,
      tabIndex: isFocused && view === 'day' ? 0 : -1,
      id: `${idPrefix}-${date}`,
      defaultContent,
    })
  }
  return models
}
