/**
 * Calendar's private subtree scoping: CalendarContext carries the root's
 * resolved state (mode, view, pane, grid, labels, and every selection
 * predicate) to the parts, while GridSectionContext carries the day grid's
 * resolved per-date models to Weekdays, Days, and Day. Neither escapes the
 * subtree; consumers see only the parts.
 */
import * as React from 'react'
import type { ISOMonth, ISOYear } from './dates/iso'
import type { GridDay, MonthGrid } from './dates/grid'
import type { WeekdayHeader } from './dates/week'
import type {
  CalendarDayRenderer,
  CalendarDayState,
  CalendarMode,
  CalendarView,
  CalendarValue,
  ISODate,
} from './types'

export interface CalendarContextValue {
  mode: CalendarMode
  /** Private view (FEATURES #10): the shown collection. Day/range home
   * is `day`; month/year modes home to their own collection. */
  view: CalendarView
  setView: (view: CalendarView) => void
  value: CalendarValue
  currentMonth: { year: number; month: number }
  locale: string
  /** CLDR week start (0 = Sunday) after the firstDayOfWeek override. */
  weekStart: number
  /** Locale-ordered weekday headers: short visible text + full names. */
  headers: WeekdayHeader[]
  /** Padded month grid for the current pane (FEATURES #4). */
  grid: MonthGrid
  /** Stable Heading id; Grid names itself from it unless overridden. */
  headingId: string
  /** Instance-local id prefix; day ids are `${idPrefix}-${ISO}`. */
  idPrefix: string
  /** A nav direction disables exactly when its target month holds no
   * enabled in-domain date (domain bounds + min/max + unavailable). */
  prevDisabled: boolean
  nextDisabled: boolean
  /** Locale target-month names for the nav buttons (FEATURES #11). */
  prevLabel: string
  nextLabel: string
  /** Today marker (FEATURES #8): explicit `today`, else the client-local
   * date after mount, else null pre-mount so SSR stays deterministic. */
  markerToday: ISODate | null
  /** Bounds pass through for keyboard bound-stops (FEATURES #7). */
  min?: ISODate
  max?: ISODate
  goToPrevMonth: () => void
  goToNextMonth: () => void
  requestMonthChange: (month: ISOMonth) => void
  selectDate: (dateStr: ISODate) => void
  /** Month activation (FEATURES #10): selection in month mode (publishes
   * `YYYY-MM`), navigation otherwise. No-op when the month is disabled. */
  selectMonth: (month: ISOMonth) => void
  /** Year activation (FEATURES #10): selection in year mode (publishes
   * `YYYY`), month-preserving navigation otherwise. No-op when disabled. */
  selectYear: (year: ISOYear) => void
  /** A month is disabled exactly when every day of it is blocked
   * (min/max/unavailable); partial months stay enabled (CA-VIEW-04,
   * CA-MODE-05). */
  isMonthDisabled: (month: ISOMonth) => boolean
  /** A year is disabled exactly when every month of it is disabled. */
  isYearDisabled: (year: ISOYear) => boolean
  isDateSelected: (dateStr: ISODate) => boolean
  /** Committed inclusive selection (FEATURES #5/#9): single match,
   * pending start, or any date inside a completed range (normalized, so
   * a reversed controlled value still paints its band). Preview-only
   * dates stay false. Drives button + td `aria-selected` (CA-RANGE-04,
   * CA-STATE-09 form). */
  isDateSelectedInclusive: (dateStr: ISODate) => boolean
  isDateInRange: (dateStr: ISODate) => boolean
  /** Committed inclusive band (FEATURES #5/#9): every date from start
   * through end, endpoints included (CA-RANGE-04). Pending values have
   * no band. Drives inclusive `data-in-range`; td paint stays
   * interior-only (frozen). */
  isDateInRangeInclusive: (dateStr: ISODate) => boolean
  isRangeStart: (dateStr: ISODate) => boolean
  isRangeEnd: (dateStr: ISODate) => boolean
  /** Out-of-bounds day state (W-21): outside `min`/`max`. Natively
   * disabled, skipped by keyboard, excluded from the roving tab order.
   * Never called with out-of-domain dates. */
  isDateDisabled: (dateStr: ISODate) => boolean
  /** Predicate-only unavailable state (W-21, exact React Aria): refused
   * by `isDateUnavailable` (`false` when no predicate). Focusable but
   * unselectable; the Grid derives `data-unavailable` from it. */
  isDateUnavailableDay: (dateStr: ISODate) => boolean
  /** Merged unselectable state: out of bounds OR unavailable. Guards
   * activation, month/year disabling, and nav-target evaluation. */
  isDateUnselectable: (dateStr: ISODate) => boolean
  /** Custom day content (W-20); a nullish return keeps the default. */
  dayRender?: CalendarDayRenderer
}

export const CalendarContext = React.createContext<CalendarContextValue | null>(null)

/** Resolved per-date model shared by the day-grid sections: the exact
 * ten-field render state plus the DOM/paint derivations. Resolved once
 * per date per grid render so `Calendar.Days` (td paint) and
 * `Calendar.Day` (button props) can never disagree. */
export interface DayCellModel {
  cell: GridDay
  renderState: CalendarDayState
  /** Endpoint/single selection: `data-selected` + button paint + the
   * preferred roving target. Range interior is NOT selected here — its
   * band paints via `paintInRange` and its semantics via
   * `selectedInclusive` (frozen-visuals split, flagged for HQ). */
  selected: boolean
  /** Committed inclusive selection: single match, pending start, or any
   * date inside a completed range. Drives button + td `aria-selected`;
   * preview-only dates stay false (CA-STATE-09 form). */
  selectedInclusive: boolean
  /** Inclusive `data-in-range`: committed band plus the valid preview
   * band (CA-RANGE-02/04). */
  inRangeInclusive: boolean
  /** td band paint: committed interior plus preview-band interior.
   * Endpoints keep radius-only paint (frozen). */
  paintInRange: boolean
  rangeStart: boolean
  rangeEnd: boolean
  disabled: boolean
  unavailable: boolean
  unselectable: boolean
  isToday: boolean
  isFocused: boolean
  tabIndex: 0 | -1
  /** Stable instance-local button id (`${idPrefix}-${ISO}`). */
  id: string
  defaultContent: React.ReactNode
}

/** Day-grid section plumbing (FEATURES #5): the Grid owns focus, preview,
 * and activation; Weekdays/Days/Day render from it. */
export interface GridSectionContextValue {
  weeks: GridDay[][]
  getModel: (date: ISODate) => DayCellModel | null
  onDayClick: (date: ISODate) => void
  onDayFocus: (date: ISODate) => void
  onDayMouseEnter: (date: ISODate) => void
  onDayMouseLeave: (date: ISODate) => void
}

export const GridSectionContext = React.createContext<GridSectionContextValue | null>(null)
