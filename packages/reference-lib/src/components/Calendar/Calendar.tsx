import * as React from 'react'
import {
  Div,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  type PrimitiveProps,
} from '@reference-ui/react'
import {
  addCalendarDays,
  formatISODate,
  formatISOMonth,
  formatISOYear,
  getDayOfWeek,
  getDaysInMonth,
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
  parseISODate,
  parseISOMonth,
  type CalendarWeekday,
  type ISODate as CanonicalISODate,
  type ISOMonth,
  type ISOYear,
} from './iso'
import { getWeekStart, getWeekdayHeaders, validateLocale, type WeekdayHeader } from './week'
import { buildMonthGrid, type GridDay, type MonthGrid } from './grid'

export type CalendarMode = 'day' | 'range' | 'month' | 'year'
/** Calendar-private interaction state (FEATURES #10): which collection is
 * shown. Never a controlled prop — the application does not branch on it. */
export type CalendarView = 'day' | 'month' | 'year'
export type ISODate = string // YYYY-MM-DD
export interface DateRangeValue {
  start: ISODate
  end: ISODate | null
}

/** Render state for the `Day` render prop (W-20): the four flags a custom
 * day cell needs. `disabled` merges both unselectable reasons (outside
 * `min`/`max`, or refused by `isDateUnavailable`); the cell chrome —
 * button, roving tabindex, ARIA — stays lib-owned either way. */
export interface CalendarDayRenderState {
  selected: boolean
  inRange: boolean
  disabled: boolean
  today: boolean
}

/** Custom day-cell content (W-20). Return `null` (or `undefined`) to keep
 * the default locale day number. Called for every rendered day button —
 * including outside-month, disabled, and unavailable days — never for
 * void (out-of-domain) padding cells, which have no button. */
export type CalendarDayRenderer = (
  date: ISODate,
  state: CalendarDayRenderState
) => React.ReactNode

// Dev-only diagnostic writer (Combobox/Splitter globalProcess pattern:
// the package declares no node types, so process comes via globalThis).
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function calendarDevDiagnostic(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`[reference-ui] Calendar: ${message}`)
}

type CalendarSharedProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  /** Required BCP 47 locale (FEATURES #3): drives headers, grid padding,
   * week boundaries, and every label. There is no default — freeze
   * decision 6 forbids a server-environment-dependent fallback. */
  locale: string
  /** Optional weekday-token override for the locale's CLDR week start
   * (FEATURES #3). Short kit tokens (`'sun'`…`'sat'`); an unrecognized
   * runtime value falls back to the locale default per the pinned kit. */
  firstDayOfWeek?: CalendarWeekday
  month?: ISOMonth // YYYY-MM
  onMonthChange?: (month: ISOMonth) => void
  min?: ISODate
  max?: ISODate
  /** Per-date availability predicate (W-21, exact React Aria name +
   * semantics). An unavailable date stays focusable — roving tabindex,
   * arrows, Home/End, and Page keys all land on it — but is unselectable
   * in every modality (`aria-disabled`, greyed, `data-unavailable`, never
   * emits). Out-of-`min`/`max` dates keep the stronger state: natively
   * disabled and skipped by keyboard. Called only with valid canonical
   * in-domain dates. */
  isDateUnavailable?: (date: ISODate) => boolean
  /** Custom day-cell content (W-20): `Day={(date, state) => node}`.
   * Replaces only the button's content — selection, disabled/unavailable,
   * and keyboard behavior stay lib-owned. A `null` return keeps the
   * default locale day number. */
  Day?: CalendarDayRenderer
  /** Seeds the default pane when neither `month` nor `value` is given.
   * Defaults to the current UTC date (previous behavior); pass an explicit
   * ISO date for SSR-safe deterministic rendering. Ignored when `month`
   * or a value-derived month is available. */
  today?: ISODate
}

/** Discriminated mode props (FEATURES #1): one `mode` discriminant, four
 * branches. `value` is required controlled with explicit `null` as the
 * empty state; `onChange` is typed per branch. There is no `defaultValue`
 * and no whole-calendar `disabled` (removed, FEATURES #14). */
export type CalendarProps =
  | (CalendarSharedProps & {
      mode?: 'day'
      value: ISODate | null
      onChange?: (value: ISODate) => void
    })
  | (CalendarSharedProps & {
      mode: 'range'
      value: DateRangeValue | null
      onChange?: (value: DateRangeValue) => void
    })
  | (CalendarSharedProps & {
      mode: 'month'
      value: ISOMonth | null
      onChange?: (value: ISOMonth) => void
    })
  | (CalendarSharedProps & {
      mode: 'year'
      value: ISOYear | null
      onChange?: (value: ISOYear) => void
    })

export type CalendarValue = ISODate | DateRangeValue | ISOMonth | ISOYear | null

/** Fail-closed validation (FEATURES #2, decided BLANK): returns the single
 * dev diagnostic when any date-like prop is invalid, `min`/`max`
 * contradict, or the mode/value shape mismatches — else null. The caller
 * renders null on a message, so no grid and no callback can escape. */
function validateCalendarProps(props: CalendarProps): string | null {
  const mode = props.mode ?? 'day'
  if (mode !== 'day' && mode !== 'range' && mode !== 'month' && mode !== 'year') {
    return `invalid mode ${JSON.stringify(mode)}. Expected "day", "range", "month", or "year".`
  }
  const value = (props as { value?: unknown }).value
  if (value === undefined) {
    return `value is required in mode "${mode}". Pass an explicit value or null.`
  }
  if (mode === 'day') {
    if (value !== null && !isValidISODate(value)) {
      return `invalid value ${JSON.stringify(value)}. Expected canonical YYYY-MM-DD or null in mode "day".`
    }
  } else if (mode === 'range') {
    if (value !== null) {
      const range = value as Partial<DateRangeValue> | null
      if (typeof range !== 'object' || range === null || Array.isArray(range)) {
        return `invalid value ${JSON.stringify(value)}. Expected { start: YYYY-MM-DD, end: YYYY-MM-DD | null } or null in mode "range".`
      }
      if (!isValidISODate(range.start)) {
        return `invalid range start in value: ${JSON.stringify(range.start)}. Expected canonical YYYY-MM-DD.`
      }
      if (range.end !== null && range.end !== undefined && !isValidISODate(range.end)) {
        return `invalid range end in value: ${JSON.stringify(range.end)}. Expected canonical YYYY-MM-DD or null.`
      }
    }
  } else if (mode === 'month') {
    if (value !== null && !isValidISOMonth(value)) {
      return `invalid value ${JSON.stringify(value)}. Expected canonical YYYY-MM or null in mode "month".`
    }
  } else {
    if (value !== null && !isValidISOYear(value)) {
      return `invalid value ${JSON.stringify(value)}. Expected canonical YYYY or null in mode "year".`
    }
  }
  if (props.month !== undefined && !isValidISOMonth(props.month)) {
    return `invalid month ${JSON.stringify(props.month)}. Expected canonical YYYY-MM.`
  }
  if (props.today !== undefined && !isValidISODate(props.today)) {
    return `invalid today ${JSON.stringify(props.today)}. Expected canonical YYYY-MM-DD.`
  }
  if (props.min !== undefined && !isValidISODate(props.min)) {
    return `invalid min ${JSON.stringify(props.min)}. Expected canonical YYYY-MM-DD.`
  }
  if (props.max !== undefined && !isValidISODate(props.max)) {
    return `invalid max ${JSON.stringify(props.max)}. Expected canonical YYYY-MM-DD.`
  }
  if (
    props.min !== undefined &&
    props.max !== undefined &&
    isValidISODate(props.min) &&
    isValidISODate(props.max) &&
    props.min > props.max
  ) {
    return `contradictory bounds min ${JSON.stringify(props.min)} > max ${JSON.stringify(props.max)}.`
  }
  // Required locale (FEATURES #3) fails closed like every other invalid
  // prop: one diagnostic, null render, no callbacks.
  const locale = (props as { locale?: unknown }).locale
  if (locale === undefined) {
    return `locale is required. Pass an explicit BCP 47 locale such as "en-US".`
  }
  if (typeof locale !== 'string') {
    return `invalid locale ${JSON.stringify(locale)}. Expected a BCP 47 locale string such as "en-US".`
  }
  try {
    validateLocale(locale)
  } catch (error) {
    return error instanceof Error ? error.message : `invalid locale ${JSON.stringify(locale)}.`
  }
  try {
    // Structural probe: every render-time formatter below must accept it.
    new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
  } catch {
    return `invalid locale ${JSON.stringify(locale)}. Expected a structurally valid BCP 47 locale.`
  }
  const day = (props as { Day?: unknown }).Day
  if (day !== undefined && typeof day !== 'function') {
    return `invalid Day ${JSON.stringify(day)}. Expected a render function (date, state) => ReactNode.`
  }
  return null
}

interface CalendarContextValue {
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
  isDateInRange: (dateStr: ISODate) => boolean
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

/** Locale month/year name ("February 2024") for Heading + nav targets.
 * Gregorian is forced so locales with another default calendar keep
 * their language while naming the rendered Gregorian pane (CA-LOC-08);
 * explicit non-Gregorian requests never reach here (fail-closed). */
function formatMonthYear(locale: string, year: number, month0: number): string {
  // Date.UTC maps years 0..99 onto 19xx; setUTCFullYear restores the true
  // proleptic-Gregorian year (same correction the grid kernels apply).
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

/** Locale year name ("2024") for the month/year Heading views. Same
 * Gregorian forcing and year-0..99 correction as formatMonthYear. */
function formatYear(locale: string, year: number): string {
  const date = new Date(Date.UTC(2000, 0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

/** Locale short month name ("Jun") for a month cell. */
function formatShortMonth(locale: string, year: number, month0: number): string {
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'short',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

/** Locale long month name ("June") for the Month drill-down button. */
function formatLongMonth(locale: string, year: number, month0: number): string {
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'long',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

/** Home collection per mode (FEATURES #10): day/range drill from the day
 * grid; month/year modes live in their own collection. */
function getHomeView(mode: CalendarMode): CalendarView {
  if (mode === 'month') return 'month'
  if (mode === 'year') return 'year'
  return 'day'
}

/** Adjacent month, or null when the step would leave 0001–9999. */
function shiftMonth(
  year: number,
  month0: number,
  delta: -1 | 1
): { year: number; month: number } | null {
  let nextY = year
  let nextM = month0 + delta
  if (nextM < 0) {
    nextM = 11
    nextY -= 1
  } else if (nextM > 11) {
    nextM = 0
    nextY += 1
  }
  if (nextY < 1 || nextY > 9999) return null
  return { year: nextY, month: nextM }
}

const CalendarContext = React.createContext<CalendarContextValue | null>(null)

export type CalendarHeaderProps = PrimitiveProps<'div'>

export function CalendarHeader({
  children,
  className,
  style,
  ...props
}: CalendarHeaderProps) {
  return (
    <Div
      data-reference-calendar-header=""
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      mb="2r"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}

export type CalendarHeadingProps = PrimitiveProps<'div'>

export function CalendarHeading({
  children,
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  // Locale-formatted div + the stable polite atomic announcement source
  // (FEATURES #11): one text mutation per accepted month, no global
  // announcer. Sync text — never effect-written — so mount produces no
  // redundant post-mount mutation (CA-GRID-12). Explicit children (the
  // default Month/Year drill-down buttons) replace the text; otherwise
  // the text names the shown collection — month + year in day view, the
  // year alone in month/year view (CA-VIEW-11).
  const { currentMonth, locale, headingId, view } = context
  const text =
    view === 'day'
      ? formatMonthYear(locale, currentMonth.year, currentMonth.month)
      : formatYear(locale, currentMonth.year)

  return (
    <Div
      data-reference-calendar-heading=""
      id={headingId}
      aria-live="polite"
      aria-atomic="true"
      p="1r 2r"
      fontSize="4r"
      fontWeight="600"
      m="0"
      color="design.text.base"
      display={children !== undefined ? 'inline-flex' : undefined}
      alignItems={children !== undefined ? 'center' : undefined}
      gap={children !== undefined ? '1r' : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children ?? text}
    </Div>
  )
}

export type CalendarMonthProps = PrimitiveProps<'button'>

export function CalendarMonth({
  children,
  className,
  style,
  onClick,
  ...props
}: CalendarMonthProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { currentMonth, locale, view, setView, mode } = context
  const isPressed = view === 'month'
  const monthName = formatLongMonth(locale, currentMonth.year, currentMonth.month)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      // Toggle the private month view; in month mode the home collection
      // is month, so there is nothing to toggle back to (CA-VIEW-02).
      setView(isPressed ? (mode === 'month' ? 'month' : 'day') : 'month')
    }
  }

  return (
    <Button
      type="button"
      data-reference-calendar-month=""
      aria-pressed={isPressed}
      aria-label={monthName}
      onClick={handleClick}
      bg="transparent"
      border="none"
      p="1r"
      borderRadius="sm"
      fontSize="4r"
      fontWeight="600"
      color="design.text.base"
      cursor="pointer"
      className={className}
      style={style}
      {...props}
    >
      {children ?? monthName}
    </Button>
  )
}

export type CalendarYearProps = PrimitiveProps<'button'>

export function CalendarYear({
  children,
  className,
  style,
  onClick,
  ...props
}: CalendarYearProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { currentMonth, view, setView, mode } = context
  const isPressed = view === 'year'
  const yearText = String(currentMonth.year)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      setView(isPressed ? (mode === 'year' ? 'year' : 'day') : 'year')
    }
  }

  return (
    <Button
      type="button"
      data-reference-calendar-year=""
      aria-pressed={isPressed}
      onClick={handleClick}
      bg="transparent"
      border="none"
      p="1r"
      borderRadius="sm"
      fontSize="4r"
      fontWeight="600"
      color="design.text.base"
      cursor="pointer"
      className={className}
      style={style}
      {...props}
    >
      {children ?? yearText}
    </Button>
  )
}

export type CalendarPrevButtonProps = PrimitiveProps<'button'>

export function CalendarPrevButton({
  children = '‹',
  className,
  style,
  onClick,
  ...props
}: CalendarPrevButtonProps) {
  const context = React.useContext(CalendarContext)
  // Month stepping is a day-view gesture: in month/year view Previous is
  // native-disabled and silent (CA-VIEW-08).
  const navDisabled = (context?.prevDisabled ?? false) || (context ? context.view !== 'day' : false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToPrevMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label={context?.prevLabel ?? 'Previous month'}
      disabled={navDisabled}
      onClick={handleClick}
      width="7r"
      height="7r"
      p="0"
      borderRadius="sm"
      border="none"
      bg="transparent"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor={navDisabled ? 'not-allowed' : 'pointer'}
      _hover={!navDisabled ? { bg: 'ui.button.mutedBackground' } : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type CalendarNextButtonProps = PrimitiveProps<'button'>

export function CalendarNextButton({
  children = '›',
  className,
  style,
  onClick,
  ...props
}: CalendarNextButtonProps) {
  const context = React.useContext(CalendarContext)
  // Month stepping is a day-view gesture: in month/year view Next is
  // native-disabled and silent (CA-VIEW-08).
  const navDisabled = (context?.nextDisabled ?? false) || (context ? context.view !== 'day' : false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToNextMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label={context?.nextLabel ?? 'Next month'}
      disabled={navDisabled}
      onClick={handleClick}
      width="7r"
      height="7r"
      p="0"
      borderRadius="sm"
      border="none"
      bg="transparent"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor={navDisabled ? 'not-allowed' : 'pointer'}
      _hover={!navDisabled ? { bg: 'ui.button.mutedBackground' } : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type CalendarGridProps = PrimitiveProps<'table'> & {
  ref?: React.Ref<HTMLTableElement>
}

export function CalendarGrid({
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: CalendarGridProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const {
    view,
    currentMonth,
    headers,
    grid,
    headingId,
    idPrefix,
    markerToday,
    weekStart,
    min,
    max,
    requestMonthChange,
    selectDate,
    isDateSelected,
    isDateInRange,
    isRangeStart,
    isRangeEnd,
    isDateDisabled,
    isDateUnavailableDay,
    isDateUnselectable,
    dayRender,
  } = context

  const gridRef = React.useRef<HTMLTableElement>(null)
  const setGridRef = React.useCallback(
    (node: HTMLTableElement | null) => {
      gridRef.current = node
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLTableElement | null>).current = node
      }
    },
    [consumerRef]
  )

  // Padding past the 0001/9999 domain edge is not a date: void cells stay
  // empty so the predicate only ever sees valid canonical in-domain
  // strings (CA-STATE-05) and no out-of-domain value can escape (CA-ISO-08).
  const renderedDays = React.useMemo(
    () => grid.allDays.filter((cell) => cell.year >= 1 && cell.year <= 9999),
    [grid]
  )
  const renderedSet = React.useMemo(
    () => new Set<string>(renderedDays.map((cell) => cell.date)),
    [renderedDays]
  )

  // Preferred roving target (CA-STATE-03): in-bounds rendered
  // selection, then in-bounds rendered today, then the first in-bounds
  // in-month day, then the first in-bounds rendered day. Unavailable
  // days are in-bounds and fully participate (W-21). Null when nothing
  // is in bounds — no artificial tab stop (CA-STATE-07).
  const computePreferredTarget = React.useCallback((): ISODate | null => {
    const enabledSelected = renderedDays.find(
      (cell) => !isDateDisabled(cell.date) && isDateSelected(cell.date)
    )
    if (enabledSelected) return enabledSelected.date
    if (markerToday && renderedSet.has(markerToday) && !isDateDisabled(markerToday)) {
      return markerToday
    }
    const firstInMonth = renderedDays.find(
      (cell) => !cell.outsideMonth && !isDateDisabled(cell.date)
    )
    if (firstInMonth) return firstInMonth.date
    return renderedDays.find((cell) => !isDateDisabled(cell.date))?.date ?? null
  }, [renderedDays, renderedSet, isDateDisabled, isDateSelected, markerToday])

  const [focusedDate, setFocusedDate] = React.useState<ISODate | null>(computePreferredTarget)

  // Nearest focusable (in-bounds) rendered date to a lost target,
  // forward-first (CA-DYNAMIC-02: April 10 → April 11), else null.
  // Unavailable days are focusable landing spots (W-21).
  const nearestFocusable = React.useCallback(
    (origin: ISODate | null): ISODate | null => {
      const originIndex = origin ? renderedDays.findIndex((cell) => cell.date === origin) : -1
      const scan = (from: number, step: 1 | -1): ISODate | null => {
        for (let i = from; i >= 0 && i < renderedDays.length; i += step) {
          if (!isDateDisabled(renderedDays[i].date)) return renderedDays[i].date
        }
        return null
      }
      if (originIndex >= 0) {
        return scan(originIndex + 1, 1) ?? scan(originIndex - 1, -1)
      }
      return scan(0, 1)
    },
    [renderedDays, isDateDisabled]
  )

  // Cross-month keyboard/outside-day focus (CA-KEY-07, CA-MONTH-07):
  // requested but not yet rendered. Applied after the parent commits
  // the month; dropped when stale (CA-KEY-10).
  const pendingFocusRef = React.useRef<{
    date: ISODate
    focusWasInGrid: boolean
    from: ISOMonth
  } | null>(null)

  const focusInGrid = () => {
    const root = gridRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!gridRef.current?.contains(active)
  }
  // True when focus fell out of the document entirely (disable-blur or
  // unmount drops it to body) rather than landing on a real target —
  // the only case where rebuilding grid focus cannot steal (CA-KEY-10).
  const focusLostToBody = () => {
    const root = gridRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement ?? null
    return active === null || active === (root as Document).body
  }
  // Grid-owned focus across synchronous browser drops: disabling or
  // unmounting the focused day blurs to body/null *during* the commit,
  // before effects run, so the live check alone would miss it. A blur
  // onto a real outside target clears the flag; a null-target blur
  // (disable/unmount — or a dead-space click, the accepted corner)
  // keeps the last value.
  const hadGridFocusRef = React.useRef(false)
  const handleGridFocusCapture = (event: React.FocusEvent) => {
    if (gridRef.current?.contains(event.target as Node)) hadGridFocusRef.current = true
  }
  const handleGridBlurCapture = (event: React.FocusEvent) => {
    const related = event.relatedTarget as Node | null
    if (related && gridRef.current?.contains(related)) return
    if (related) hadGridFocusRef.current = false
  }
  const focusDay = (date: ISODate) => {
    // Owner-root-safe: query inside the grid element, never the
    // document, so Shadow DOM keeps working (CA-ENV-03).
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)?.focus()
  }

  const showingMonth = formatISOMonth(currentMonth.year, currentMonth.month + 1)

  // Grid identity across commits: a rebuild (month/locale change) may
  // replace the focused day's node while its ISO stays the tab target.
  const prevGridRef = React.useRef<MonthGrid | null>(null)

  React.useEffect(() => {
    const gridChanged = prevGridRef.current !== grid
    prevGridRef.current = grid
    const pending = pendingFocusRef.current
    if (pending) {
      const pendingMonth = pending.date.slice(0, 7)
      if (pendingMonth !== showingMonth) {
        if (showingMonth !== pending.from) {
          // The pane moved elsewhere while the request was pending → the
          // target is stale; drop it (CA-KEY-10 programmatic-month case).
          pendingFocusRef.current = null
        } else {
          // Still waiting on the parent (CA-KEY-07): the target may
          // already be visible as padding, but focus stays on the origin
          // until the month commits. Keep the tab target valid meanwhile.
          if (focusedDate && renderedSet.has(focusedDate) && !isDateDisabled(focusedDate)) return
          const next =
            focusedDate && renderedSet.has(focusedDate)
              ? nearestFocusable(focusedDate)
              : computePreferredTarget()
          if (next !== focusedDate) setFocusedDate(next)
          return
        }
      } else if (renderedSet.has(pending.date) && !isDateDisabled(pending.date)) {
        pendingFocusRef.current = null
        setFocusedDate(pending.date)
        if (pending.focusWasInGrid) focusDay(pending.date)
        return
      } else {
        // Committed but unusable (out of bounds/removed) → drop and
        // relocate to one valid tab target without stealing focus
        // (CA-KEY-10). Unavailable targets stay usable (W-21).
        pendingFocusRef.current = null
      }
    }
    if (focusedDate && renderedSet.has(focusedDate) && !isDateDisabled(focusedDate)) {
      // Valid target, but a rebuild may have dropped its node: repair
      // grid-owned DOM focus only when it fell to body (CA-LOC-07).
      if (gridChanged && hadGridFocusRef.current && !focusInGrid() && focusLostToBody()) {
        focusDay(focusedDate)
      }
      return
    }
    // Out of bounds in place → nearest (CA-DYNAMIC-02); unrendered (month
    // or locale moved on) → preferred target (CA-DYNAMIC-03, CA-LOC-07).
    // DOM focus follows only when it was grid-owned: live in the grid,
    // or dropped by the same commit's disable/unmount.
    const next =
      focusedDate && renderedSet.has(focusedDate)
        ? nearestFocusable(focusedDate)
        : computePreferredTarget()
    if (next !== focusedDate) {
      setFocusedDate(next)
      if (next && (focusInGrid() || hadGridFocusRef.current)) focusDay(next)
    }
  })

  // Out-of-bounds skip: walk from the candidate while blocked, stopping
  // at the inclusive bounds without wrapping (CA-KEY-05). Unavailable
  // dates are landing spots, not skipped (W-21). The step cap terminates
  // fully-blocked spans instead of looping (CA-KEY-06); ten thousand
  // days covers any plausible constraint window.
  const skipToFocusable = (
    candidate: ISODate,
    step: 1 | -1,
    minBound: ISODate,
    maxBound: ISODate
  ): ISODate | null => {
    let current = candidate
    for (let i = 0; i < 10000; i++) {
      if (current < minBound || current > maxBound) return null
      if (!isDateDisabled(current)) return current
      try {
        // Canonical by construction: the candidate entered validated and
        // every step preserves canonical form.
        current = addCalendarDays(current as CanonicalISODate, step)
      } catch {
        return null // Gregorian domain edge
      }
    }
    return null
  }

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Grid onKeyDown ran first
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return // CA-KEY-04
    const target = event.target as HTMLElement | null
    const dayButton = target?.closest?.('button[data-date]') ?? null
    if (!dayButton || !gridRef.current?.contains(dayButton)) return
    const origin = dayButton.getAttribute('data-date') as ISODate
    const key = event.key
    const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
    const vertical = key === 'ArrowUp' || key === 'ArrowDown'
    if (
      !horizontal &&
      !vertical &&
      key !== 'Home' &&
      key !== 'End' &&
      key !== 'PageUp' &&
      key !== 'PageDown'
    ) {
      return
    }
    // Inherited RTL reverses only the visual horizontal keys (CA-LOC-06);
    // time itself never reverses.
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const rtl = dirTarget === 'rtl'
    const minBound = (min ?? '0001-01-01') as ISODate
    const maxBound = (max ?? '9999-12-31') as ISODate

    let candidate: ISODate | null = null
    if (horizontal || vertical) {
      const step =
        key === 'ArrowLeft'
          ? rtl
            ? 1
            : -1
          : key === 'ArrowRight'
            ? rtl
              ? -1
              : 1
            : key === 'ArrowUp'
              ? -1
              : 1
      const dirOrStep: 1 | -1 = step > 0 ? 1 : -1
      try {
        candidate = skipToFocusable(
          addCalendarDays(origin as CanonicalISODate, vertical ? step * 7 : step),
          dirOrStep,
          minBound,
          maxBound
        )
      } catch {
        candidate = null
      }
    } else if (key === 'Home' || key === 'End') {
      // Locale week boundary (CA-KEY-02); out-of-bounds boundary dates
      // skip inward toward the origin week interior. Unavailable
      // boundaries are landing spots (W-21).
      try {
        const { year, month, day } = parseISODate(origin)
        const dow = getDayOfWeek(year, month, day)
        const offset =
          key === 'Home' ? (dow - weekStart + 7) % 7 : (weekStart + 6 - dow + 7) % 7
        const inward: 1 | -1 = key === 'Home' ? 1 : -1
        // The origin is a rendered canonical date; steps preserve form.
        let current: ISODate = addCalendarDays(origin as CanonicalISODate, key === 'Home' ? -offset : offset)
        candidate = null
        for (let i = 0; i <= offset; i++) {
          if (!isDateDisabled(current)) {
            candidate = current
            break
          }
          if (current === origin) break
          current = addCalendarDays(current as CanonicalISODate, inward)
        }
      } catch {
        candidate = null
      }
    } else {
      // Adjacent month preserving the day when possible, constrained at
      // month end (CA-KEY-03); focus applies after the month commits.
      const { year, month, day } = parseISODate(origin)
      const direction = key === 'PageUp' ? -1 : 1
      const targetMonth = shiftMonth(year, month - 1, direction)
      if (targetMonth) {
        const clampedDay = Math.min(day, getDaysInMonth(targetMonth.year, targetMonth.month + 1))
        candidate = skipToFocusable(
          formatISODate(targetMonth.year, targetMonth.month + 1, clampedDay),
          direction,
          minBound,
          maxBound
        )
      }
    }

    event.preventDefault() // handled keys never scroll (CA-KEY-01)
    if (!candidate || candidate === origin) return
    // Movement changes only focus and, when necessary, the requested
    // month — never selection (CA-KEY-08).
    if (candidate.slice(0, 7) === showingMonth) {
      setFocusedDate(candidate)
      focusDay(candidate)
    } else {
      pendingFocusRef.current = { date: candidate, focusWasInGrid: focusInGrid(), from: showingMonth }
      requestMonthChange(candidate.slice(0, 7) as ISOMonth)
    }
  }

  const handleDayClick = (cell: GridDay) => {
    if (isDateUnselectable(cell.date)) return // locked out in every modality (CA-SINGLE-04)
    if (cell.outsideMonth) {
      // Outside activation requests the month first, then the date
      // (CA-SINGLE-07); focus survives month acceptance (CA-MONTH-07).
      pendingFocusRef.current = {
        date: cell.date,
        focusWasInGrid: focusInGrid(),
        from: showingMonth,
      }
      requestMonthChange(formatISOMonth(cell.year, cell.month))
    }
    setFocusedDate(cell.date) // the roving target follows activation (CA-SINGLE-01)
    selectDate(cell.date)
  }

  return (
    <Table
      ref={setGridRef}
      role="grid"
      data-reference-calendar-grid=""
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : headingId)}
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleGridKeyDown(event)
      }}
      onFocusCapture={handleGridFocusCapture}
      onBlurCapture={handleGridBlurCapture}
      borderCollapse="collapse"
      tableLayout="fixed"
      width="100%"
      textAlign="center"
      className={className}
      // One collection is ever shown: display:none drops the day table
      // from the accessibility tree and tab order in month/year view
      // (CA-VIEW-01/04) while keeping grid state across toggles.
      style={{ display: view === 'day' ? undefined : 'none', ...style }}
      {...props}
    >
      <Thead>
        <Tr role="row">
          {headers.map((header) => (
            <Th
              key={header.weekday}
              role="columnheader"
              scope="col"
              aria-label={header.accessibleName}
              fontSize="3r"
              color="design.text.light"
              p="1r 0"
              fontWeight="500"
            >
              {header.visibleText}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {grid.weeks.map((week, wIdx) => (
          <Tr key={wIdx} role="row">
            {week.map((cell) => {
              if (cell.year < 1 || cell.year > 9999) {
                return <Td key={cell.date} role="gridcell" p="0.5r 0" />
              }

              const selected = isDateSelected(cell.date)
              const inRange = isDateInRange(cell.date)
              const rangeStart = isRangeStart(cell.date)
              const rangeEnd = isRangeEnd(cell.date)
              const disabled = isDateDisabled(cell.date)
              // Unavailable is the focusable half of unselectable (W-21):
              // out-of-bounds already implies it, so the flag marks only
              // the in-bounds predicate-refused dates.
              const unavailable = !disabled && isDateUnavailableDay(cell.date)
              const unselectable = disabled || unavailable
              const isToday = markerToday === cell.date
              const isFocused = focusedDate === cell.date
              // Custom content (W-20) replaces only the button's children;
              // nullish keeps the default locale day number.
              const dayContent =
                dayRender?.(cell.date, {
                  selected,
                  inRange,
                  disabled: unselectable,
                  today: isToday,
                }) ?? cell.formattedDay

              return (
                <Td
                  key={cell.date}
                  role="gridcell"
                  p="0.5r 0"
                  textAlign="center"
                  bg={inRange ? 'ui.table.row.mutedBackground' : undefined}
                  borderTopLeftRadius={rangeStart ? 'full' : undefined}
                  borderBottomLeftRadius={rangeStart ? 'full' : undefined}
                  borderTopRightRadius={rangeEnd ? 'full' : undefined}
                  borderBottomRightRadius={rangeEnd ? 'full' : undefined}
                >
                  <Button
                    type="button"
                    id={`${idPrefix}-${cell.date}`}
                    // The roving target is tabbable only in its own view:
                    // a display:none collection is never a tab stop, so
                    // exactly one tab stop exists per shown collection.
                    tabIndex={isFocused && view === 'day' ? 0 : -1}
                    disabled={disabled}
                    aria-disabled={unselectable ? 'true' : undefined}
                    aria-selected={selected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={cell.accessibleName}
                    data-date={cell.date}
                    data-selected={selected ? '' : undefined}
                    data-in-range={inRange ? '' : undefined}
                    data-outside-month={cell.outsideMonth ? '' : undefined}
                    data-today={isToday ? '' : undefined}
                    data-disabled={disabled ? '' : undefined}
                    data-unavailable={unavailable ? '' : undefined}
                    data-focused={isFocused ? '' : undefined}
                    onClick={() => handleDayClick(cell)}
                    width="7r"
                    height="7r"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    border="none"
                    bg={selected ? 'ui.button.background' : 'transparent'}
                    color={
                      selected
                        ? 'ui.button.foreground'
                        : unselectable || cell.outsideMonth
                          ? 'design.text.light'
                          : 'design.text.base'
                    }
                    fontSize="3r"
                    fontWeight={selected || isToday ? '600' : '400'}
                    textDecoration={isToday ? 'underline' : undefined}
                    textUnderlineOffset={isToday ? '0.15em' : undefined}
                    cursor={unselectable ? 'not-allowed' : 'pointer'}
                    outline="none"
                    _hover={!selected && !unselectable ? { bg: 'ui.button.mutedBackground' } : undefined}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
                  >
                    {dayContent}
                  </Button>
                </Td>
              )
            })}
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

/** Horizontal arrow delta in a 3-column collection (CA-VIEW-10):
 * inherited RTL reverses only the visual horizontal keys; vertical
 * keys never reverse. Null when the key is not a collection move. */
function collectionKeyDelta(key: string, rtl: boolean): number | null {
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  if (key === 'ArrowUp') return -3
  if (key === 'ArrowDown') return 3
  return null
}

interface MonthCellData {
  month: ISOMonth
  label: string
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

/** Range paint for one month cell (CA-VIEW-09): completed ranges mark
 * start/end/in-range inclusively, a pending start marks itself alone,
 * and hovering never invents day-grid preview attributes (there is no
 * preview machine on this branch, so the "without preview" half holds
 * trivially). */
function monthRangePaint(
  month: ISOMonth,
  value: CalendarValue
): { selected: boolean; rangeStart: boolean; rangeEnd: boolean; inRange: boolean } {
  const empty = { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
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

export type CalendarMonthsProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  ref?: React.Ref<HTMLDivElement>
}

export function CalendarMonths({
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  ...props
}: CalendarMonthsProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { view, currentMonth, locale, mode, value, selectMonth, isMonthDisabled } = context

  const containerRef = React.useRef<HTMLDivElement>(null)
  const setContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLDivElement | null>).current = node
      }
    },
    [consumerRef]
  )

  const year = currentMonth.year
  const showingMonth = formatISOMonth(year, currentMonth.month + 1)

  const months = React.useMemo<MonthCellData[]>(() => {
    const cells: MonthCellData[] = []
    for (let m = 1; m <= 12; m++) {
      const monthStr = formatISOMonth(year, m)
      const paint =
        mode === 'month'
          ? {
              selected: value === monthStr,
              rangeStart: false,
              rangeEnd: false,
              inRange: false,
            }
          : mode === 'range'
            ? monthRangePaint(monthStr, value)
            : { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
      cells.push({
        month: monthStr,
        label: formatShortMonth(locale, year, m - 1),
        current: monthStr === showingMonth,
        selected: paint.selected,
        disabled: isMonthDisabled(monthStr),
        rangeStart: paint.rangeStart,
        rangeEnd: paint.rangeEnd,
        inRange: paint.inRange,
      })
    }
    return cells
  }, [year, showingMonth, locale, mode, value, isMonthDisabled])

  // Roving target: enabled selection, else the enabled current month,
  // else the first enabled month. Null when the whole year is blocked —
  // no artificial tab stop.
  const computePreferredMonth = React.useCallback((): ISOMonth | null => {
    const enabledSelected = months.find((cell) => !cell.disabled && cell.selected)
    if (enabledSelected) return enabledSelected.month
    const current = months.find((cell) => cell.current && !cell.disabled)
    if (current) return current.month
    return months.find((cell) => !cell.disabled)?.month ?? null
  }, [months])

  const [focusedMonth, setFocusedMonth] = React.useState<ISOMonth | null>(computePreferredMonth)

  const nearestEnabledMonth = React.useCallback(
    (origin: ISOMonth): ISOMonth | null => {
      const originIndex = months.findIndex((cell) => cell.month === origin)
      const scan = (from: number, step: 1 | -1): ISOMonth | null => {
        for (let i = from; i >= 0 && i < months.length; i += step) {
          if (!months[i].disabled) return months[i].month
        }
        return null
      }
      if (originIndex >= 0) {
        return scan(originIndex + 1, 1) ?? scan(originIndex - 1, -1)
      }
      return scan(0, 1)
    },
    [months]
  )

  const isMonthRendered = (month: ISOMonth) => parseISOMonth(month).year === year

  const focusInContainer = () => {
    const root = containerRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!containerRef.current?.contains(active)
  }
  const focusMonth = (month: ISOMonth) => {
    containerRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-month="${month}"]`)
      ?.focus()
  }

  React.useEffect(() => {
    if (
      focusedMonth &&
      isMonthRendered(focusedMonth) &&
      !isMonthDisabled(focusedMonth)
    ) {
      return
    }
    const next =
      focusedMonth && isMonthRendered(focusedMonth)
        ? nearestEnabledMonth(focusedMonth)
        : computePreferredMonth()
    if (next !== focusedMonth) {
      setFocusedMonth(next)
      if (next && focusInContainer()) focusMonth(next)
    }
  })

  const handleMonthsKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Months onKeyDown ran first
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.('button[data-month]') ?? null
    if (!cell || !containerRef.current?.contains(cell)) return
    // Activation is native button click (Enter/Space untouched, the
    // CA-SINGLE-02 day-grid rule — no synthetic double-fire). Arrows move
    // focus in the 3-column field without selecting (CA-VIEW-10).
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const delta = collectionKeyDelta(event.key, dirTarget === 'rtl')
    if (delta === null) return
    const origin = cell.getAttribute('data-month') as ISOMonth
    const nextM = parseISOMonth(origin).month + delta
    if (nextM < 1 || nextM > 12) return
    event.preventDefault()
    const next = formatISOMonth(year, nextM)
    setFocusedMonth(next)
    // A disabled target keeps native focus where it is (focus() on a
    // disabled button is a no-op); activation stays guarded regardless.
    focusMonth(next)
  }

  const handleMonthClick = (cell: MonthCellData) => {
    if (cell.disabled) return
    setFocusedMonth(cell.month) // the roving target follows activation
    selectMonth(cell.month)
  }

  return (
    <Div
      ref={setContainerRef}
      data-reference-calendar-months=""
      gridTemplateColumns="repeat(3, 1fr)"
      gap="2r"
      p="2r"
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleMonthsKeyDown(event)
      }}
      className={className}
      style={{ display: view === 'month' ? undefined : 'none', ...style }}
      {...props}
    >
      {months.map((cell) => {
        const isFocused = focusedMonth === cell.month
        return (
          <Button
            key={cell.month}
            type="button"
            data-reference-calendar-month-cell=""
            data-month={cell.month}
            tabIndex={isFocused && view === 'month' ? 0 : -1}
            disabled={cell.disabled}
            aria-disabled={cell.disabled ? 'true' : undefined}
            data-current={cell.current ? '' : undefined}
            data-selected={cell.selected ? '' : undefined}
            data-disabled={cell.disabled ? '' : undefined}
            data-range-start={cell.rangeStart ? '' : undefined}
            data-range-end={cell.rangeEnd ? '' : undefined}
            data-in-range={cell.inRange ? '' : undefined}
            data-focused={isFocused ? '' : undefined}
            onClick={() => handleMonthClick(cell)}
            p="2r"
            borderRadius="sm"
            border="none"
            bg={cell.selected ? 'ui.button.background' : 'transparent'}
            color={
              cell.selected
                ? 'ui.button.foreground'
                : cell.disabled
                  ? 'design.text.light'
                  : 'design.text.base'
            }
            fontSize="3r"
            fontWeight={cell.selected || cell.current ? '600' : '400'}
            textDecoration={cell.current ? 'underline' : undefined}
            textUnderlineOffset={cell.current ? '0.15em' : undefined}
            cursor={cell.disabled ? 'not-allowed' : 'pointer'}
            outline="none"
            _hover={!cell.selected && !cell.disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
            _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
          >
            {cell.label}
          </Button>
        )
      })}
    </Div>
  )
}

interface YearCellData {
  year: ISOYear
  yearNum: number
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

/** Range paint for one year cell (CA-VIEW-09), mirroring monthRangePaint
 * over the year unit. */
function yearRangePaint(
  yearNum: number,
  value: CalendarValue
): { selected: boolean; rangeStart: boolean; rangeEnd: boolean; inRange: boolean } {
  const empty = { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
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

export type CalendarYearsProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  ref?: React.Ref<HTMLDivElement>
}

export function CalendarYears({
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  ...props
}: CalendarYearsProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { view, currentMonth, mode, value, min, max, selectYear, isYearDisabled } = context

  const containerRef = React.useRef<HTMLDivElement>(null)
  const setContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLDivElement | null>).current = node
      }
    },
    [consumerRef]
  )

  const year = currentMonth.year

  // Year window (CA-VIEW-06): ten either side of the shown year unbounded
  // (clamped to keep 21 in-domain at 0001/9999); min-through-max years
  // when both bounds exist; a 21-year run reaching from the single bound
  // toward the shown year otherwise.
  const years = React.useMemo<YearCellData[]>(() => {
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
    const cells: YearCellData[] = []
    for (let y = startYear; y <= endYear; y++) {
      const yearStr = formatISOYear(y)
      const paint =
        mode === 'year'
          ? {
              selected: value === yearStr,
              rangeStart: false,
              rangeEnd: false,
              inRange: false,
            }
          : mode === 'range'
            ? yearRangePaint(y, value)
            : { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
      cells.push({
        year: yearStr,
        yearNum: y,
        current: y === year,
        selected: paint.selected,
        disabled: isYearDisabled(yearStr),
        rangeStart: paint.rangeStart,
        rangeEnd: paint.rangeEnd,
        inRange: paint.inRange,
      })
    }
    return cells
  }, [year, min, max, mode, value, isYearDisabled])

  // The current in-range year scrolls into view when the collection opens.
  React.useEffect(() => {
    if (view === 'year' && containerRef.current) {
      containerRef.current
        .querySelector<HTMLElement>(`[data-reference-calendar-year-cell][data-year="${formatISOYear(year)}"]`)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [view, year])

  const computePreferredYear = React.useCallback((): ISOYear | null => {
    const enabledSelected = years.find((cell) => !cell.disabled && cell.selected)
    if (enabledSelected) return enabledSelected.year
    const current = years.find((cell) => cell.current && !cell.disabled)
    if (current) return current.year
    return years.find((cell) => !cell.disabled)?.year ?? null
  }, [years])

  const [focusedYear, setFocusedYear] = React.useState<ISOYear | null>(computePreferredYear)

  const renderedYears = React.useMemo(() => new Set(years.map((cell) => cell.year)), [years])

  const nearestEnabledYear = React.useCallback(
    (origin: ISOYear): ISOYear | null => {
      const originIndex = years.findIndex((cell) => cell.year === origin)
      const scan = (from: number, step: 1 | -1): ISOYear | null => {
        for (let i = from; i >= 0 && i < years.length; i += step) {
          if (!years[i].disabled) return years[i].year
        }
        return null
      }
      if (originIndex >= 0) {
        return scan(originIndex + 1, 1) ?? scan(originIndex - 1, -1)
      }
      return scan(0, 1)
    },
    [years]
  )

  const focusInContainer = () => {
    const root = containerRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!containerRef.current?.contains(active)
  }
  const focusYear = (yearStr: ISOYear) => {
    containerRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-year="${yearStr}"]`)
      ?.focus()
  }

  React.useEffect(() => {
    if (focusedYear && renderedYears.has(focusedYear) && !isYearDisabled(focusedYear)) {
      return
    }
    const next =
      focusedYear && renderedYears.has(focusedYear)
        ? nearestEnabledYear(focusedYear)
        : computePreferredYear()
    if (next !== focusedYear) {
      setFocusedYear(next)
      if (next && focusInContainer()) focusYear(next)
    }
  })

  const handleYearsKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Years onKeyDown ran first
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.('button[data-year]') ?? null
    if (!cell || !containerRef.current?.contains(cell)) return
    // Activation is native button click (Enter/Space untouched). Arrows
    // move focus in the 3-column field without selecting (CA-VIEW-10);
    // the target must exist in the window or the gesture is a no-op.
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const delta = collectionKeyDelta(event.key, dirTarget === 'rtl')
    if (delta === null) return
    const origin = parseInt(cell.getAttribute('data-year') as string, 10)
    const candidate = origin + delta
    if (candidate < 1 || candidate > 9999) return
    const next = formatISOYear(candidate)
    if (!renderedYears.has(next)) return
    event.preventDefault()
    setFocusedYear(next)
    focusYear(next)
  }

  const handleYearClick = (cell: YearCellData) => {
    if (cell.disabled) return
    setFocusedYear(cell.year) // the roving target follows activation
    selectYear(cell.year)
  }

  return (
    <Div
      ref={setContainerRef}
      data-reference-calendar-years=""
      gridTemplateColumns="repeat(3, 1fr)"
      gap="2r"
      p="2r"
      maxH="60r"
      overflowY="auto"
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleYearsKeyDown(event)
      }}
      className={className}
      style={{ display: view === 'year' ? undefined : 'none', ...style }}
      {...props}
    >
      {years.map((cell) => {
        const isFocused = focusedYear === cell.year
        return (
          <Button
            key={cell.year}
            type="button"
            data-reference-calendar-year-cell=""
            data-year={cell.year}
            tabIndex={isFocused && view === 'year' ? 0 : -1}
            disabled={cell.disabled}
            aria-disabled={cell.disabled ? 'true' : undefined}
            data-current={cell.current ? '' : undefined}
            data-selected={cell.selected ? '' : undefined}
            data-disabled={cell.disabled ? '' : undefined}
            data-range-start={cell.rangeStart ? '' : undefined}
            data-range-end={cell.rangeEnd ? '' : undefined}
            data-in-range={cell.inRange ? '' : undefined}
            data-focused={isFocused ? '' : undefined}
            onClick={() => handleYearClick(cell)}
            p="2r"
            borderRadius="sm"
            border="none"
            bg={cell.selected ? 'ui.button.background' : 'transparent'}
            color={
              cell.selected
                ? 'ui.button.foreground'
                : cell.disabled
                  ? 'design.text.light'
                  : 'design.text.base'
            }
            fontSize="3r"
            fontWeight={cell.selected || cell.current ? '600' : '400'}
            textDecoration={cell.current ? 'underline' : undefined}
            textUnderlineOffset={cell.current ? '0.15em' : undefined}
            cursor={cell.disabled ? 'not-allowed' : 'pointer'}
            outline="none"
            _hover={!cell.selected && !cell.disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
            _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
          >
            {cell.yearNum}
          </Button>
        )
      })}
    </Div>
  )
}

/** Month a valid value belongs to (FEATURES #12 pane seeding /
 * following): day strings and range starts via their date, month values
 * directly, year values via January. Null (or anything invalid, which
 * fail-closed already rejects) yields no month. */
function monthFromValue(value: CalendarValue): { year: number; month: number } | null {
  if (typeof value === 'string') {
    if (isValidISODate(value)) {
      const { year, month } = parseISODate(value)
      return { year, month: month - 1 }
    }
    if (isValidISOMonth(value)) {
      const { year, month } = parseISOMonth(value)
      return { year, month: month - 1 }
    }
    if (isValidISOYear(value)) {
      return { year: Number(value), month: 0 }
    }
    return null
  }
  if (value && typeof value === 'object' && 'start' in value && isValidISODate(value.start)) {
    const { year, month } = parseISODate(value.start)
    return { year, month: month - 1 }
  }
  return null
}

function systemMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() }
}

export function Calendar(calendarProps: CalendarProps) {
  const {
    children,
    mode = 'day',
    value,
    onChange,
    locale,
    firstDayOfWeek,
    month: monthProp,
    onMonthChange,
    min,
    max,
    isDateUnavailable,
    Day: dayRender,
    today,
    className,
    style,
    ...props
  } = calendarProps
  // Fail-closed (FEATURES #2, decided BLANK): one dev diagnostic, null
  // render. Computed before hooks; the early return below runs after all
  // hooks so hook order stays stable across valid/invalid transitions.
  const invalid = validateCalendarProps(calendarProps)

  // Uncontrolled pane seed (FEATURES #12): value, else today, else the
  // system month. Total — invalid props fall through to the next source
  // so an invalid→valid transition never strands garbage month state.
  const [internalMonth, setInternalMonth] = React.useState(() => {
    if (monthProp && isValidISOMonth(monthProp)) {
      const { year, month } = parseISOMonth(monthProp)
      return { year, month: month - 1 }
    }
    return (
      monthFromValue(value as CalendarValue) ??
      (today && isValidISODate(today)
        ? { year: parseISODate(today).year, month: parseISODate(today).month - 1 }
        : systemMonth())
    )
  })
  // Controlled `month` stays independent of `value` (CA-MONTH-01): it is
  // re-derived from the prop every render, never from pane state. An
  // invalid `month` renders null via fail-closed; internalMonth is only
  // the unreachable fallback that keeps hooks total.
  const currentMonth =
    monthProp && isValidISOMonth(monthProp)
      ? { year: parseISOMonth(monthProp).year, month: parseISOMonth(monthProp).month - 1 }
      : internalMonth

  // Omitted `month` follows the controlled value's month (CA-MONTH-09):
  // a new value re-seats the pane, while user navigation with an
  // unchanged value is untouched. Remount re-seeds via the useState
  // initializer above (CA-MONTH-10). Null values keep the current pane.
  const followedMonth = React.useMemo(
    () => (monthProp === undefined ? monthFromValue(value as CalendarValue) : null),
    [monthProp, value]
  )
  React.useEffect(() => {
    if (!followedMonth) return
    setInternalMonth((prev) =>
      prev.year === followedMonth.year && prev.month === followedMonth.month ? prev : followedMonth
    )
  }, [followedMonth])

  // Private view (FEATURES #10): the mode's home collection, reset when
  // the mode changes (CA-VIEW-12), returned home when the pane commits a
  // new month — controlled or internal alike (CA-VIEW-05/07). View
  // toggles never touch the pane, so this effect only answers month and
  // mode edges.
  const [view, setView] = React.useState<CalendarView>(() => getHomeView(mode))
  const showingMonthStr = formatISOMonth(currentMonth.year, currentMonth.month + 1)
  React.useEffect(() => {
    setView(getHomeView(mode))
  }, [showingMonthStr, mode])

  // Today marker (FEATURES #8): explicit `today` renders synchronously
  // (SSR-deterministic); an omitted `today` marks the client-local date
  // only after mount, so SSR and first hydration render no marker and
  // hydrate warning-free (CA-STATE-11). Local — not UTC — date.
  const [mountedToday, setMountedToday] = React.useState<ISODate | null>(null)
  React.useEffect(() => {
    if (today !== undefined) return
    const now = new Date()
    setMountedToday(formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate()))
  }, [today])
  const markerToday = today ?? mountedToday

  // Out-of-bounds day state (W-21): outside the canonical bounds.
  // Natively disabled, keyboard-skipped, never the roving target.
  // Lexical comparison is exact here — bounds passed the CA-ISO-04
  // canonical gate and grid dates are canonical by construction.
  const isDateDisabled = React.useCallback(
    (dateStr: ISODate) => {
      if (min !== undefined && dateStr < min) return true
      if (max !== undefined && dateStr > max) return true
      return false
    },
    [min, max]
  )

  // Predicate-only unavailable state (W-21): refused by
  // `isDateUnavailable`, regardless of bounds. Focusable but
  // unselectable; the Grid intersects it with in-bounds for paint.
  const isDateUnavailableDay = React.useCallback(
    (dateStr: ISODate) => isDateUnavailable?.(dateStr) ?? false,
    [isDateUnavailable]
  )

  // Merged unselectable state: activation, month/year disabling, and
  // the W-20 Day `disabled` flag all read this.
  const isDateUnselectable = React.useCallback(
    (dateStr: ISODate) => isDateDisabled(dateStr) || isDateUnavailableDay(dateStr),
    [isDateDisabled, isDateUnavailableDay]
  )

  // Month/year non-interactive states (FEATURES #10): a unit is disabled
  // exactly when every day of it is unselectable, so partial months stay
  // enabled (CA-VIEW-04) and a unit flips only when its last day does
  // (CA-MODE-05). Whole units outside the bound months short-circuit
  // without scanning days; the predicate scan is inherent to the
  // CA-MODE-05 contract and memoized at the collection level.
  const isMonthDisabled = React.useCallback(
    (monthStr: ISOMonth) => {
      if (min !== undefined && monthStr < min.slice(0, 7)) return true
      if (max !== undefined && monthStr > max.slice(0, 7)) return true
      const { year: y, month: m } = parseISOMonth(monthStr)
      if (y < 1 || y > 9999) return true
      const days = getDaysInMonth(y, m)
      for (let day = 1; day <= days; day++) {
        if (!isDateUnselectable(formatISODate(y, m, day))) return false
      }
      return true
    },
    [min, max, isDateUnselectable]
  )

  const isYearDisabled = React.useCallback(
    (yearStr: ISOYear) => {
      const y = Number(yearStr)
      if (!Number.isInteger(y) || y < 1 || y > 9999) return true
      if (min !== undefined && y < parseISODate(min).year) return true
      if (max !== undefined && y > parseISODate(max).year) return true
      for (let m = 1; m <= 12; m++) {
        if (!isMonthDisabled(formatISOMonth(y, m))) return false
      }
      return true
    },
    [min, max, isMonthDisabled]
  )

  // A nav direction disables exactly when its target month holds no
  // enabled in-domain date: domain edge, fully out-of-bounds, or wholly
  // unavailable (CA-MONTH-04). Partial target months stay navigable.
  // Predicate evaluation runs day 1 → N, deterministically.
  const navModel = React.useMemo(() => {
    const prevTarget = shiftMonth(currentMonth.year, currentMonth.month, -1)
    const nextTarget = shiftMonth(currentMonth.year, currentMonth.month, 1)
    if (invalid) {
      // Fail-closed owns invalid props and renders null below; keep the
      // memo total without touching the predicate, so no callback can
      // observe an invalid fixture (CA-ISO-06).
      return {
        prevTarget,
        nextTarget,
        prevDisabled: !prevTarget,
        nextDisabled: !nextTarget,
        prevLabel: 'Previous month',
        nextLabel: 'Next month',
      }
    }
    const targetHasEnabledDate = (target: { year: number; month: number }) => {
      const days = getDaysInMonth(target.year, target.month + 1)
      for (let day = 1; day <= days; day++) {
        const dateStr = formatISODate(target.year, target.month + 1, day)
        if (min !== undefined && dateStr < min) continue
        if (max !== undefined && dateStr > max) break // days ascend
        if (!(isDateUnavailable?.(dateStr) ?? false)) return true
      }
      return false
    }
    const prevDisabled = !prevTarget || !targetHasEnabledDate(prevTarget)
    const nextDisabled = !nextTarget || !targetHasEnabledDate(nextTarget)
    // Navigation names its target month (CA-LOC-05); a disabled
    // direction keeps the generic name rather than naming a month with
    // no enabled date. Total under invalid locales — fail-closed owns
    // those, and this memo runs before the early return.
    const safeLabel = (target: { year: number; month: number } | null, fallback: string) => {
      if (!target) return fallback
      try {
        return formatMonthYear(locale, target.year, target.month)
      } catch {
        return fallback
      }
    }
    const prevLabel = prevDisabled ? 'Previous month' : safeLabel(prevTarget, 'Previous month')
    const nextLabel = nextDisabled ? 'Next month' : safeLabel(nextTarget, 'Next month')
    return { prevTarget, nextTarget, prevDisabled, nextDisabled, prevLabel, nextLabel }
  }, [invalid, currentMonth, locale, min, max, isDateUnavailable])
  const { prevTarget, nextTarget, prevDisabled, nextDisabled, prevLabel, nextLabel } = navModel

  // One request seam for nav buttons, outside days, and Page keys:
  // omitted `month` commits internally, controlled `month` only
  // requests; the callback stays ISO either way.
  const requestMonthChange = React.useCallback(
    (monthStr: ISOMonth) => {
      if (!monthProp) {
        const { year, month } = parseISOMonth(monthStr)
        setInternalMonth({ year, month: month - 1 })
      }
      onMonthChange?.(monthStr)
    },
    [monthProp, onMonthChange]
  )

  const goToPrevMonth = React.useCallback(() => {
    // The buttons already disable off the day view; the guard here keeps
    // synthetic dispatch silent too (CA-VIEW-08).
    if (prevDisabled || !prevTarget || view !== 'day') return
    requestMonthChange(formatISOMonth(prevTarget.year, prevTarget.month + 1))
  }, [prevDisabled, prevTarget, requestMonthChange, view])

  const goToNextMonth = React.useCallback(() => {
    if (nextDisabled || !nextTarget || view !== 'day') return
    requestMonthChange(formatISOMonth(nextTarget.year, nextTarget.month + 1))
  }, [nextDisabled, nextTarget, requestMonthChange, view])

  const isDateSelected = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'day') {
        return value === dateStr
      }
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.start === dateStr || range.end === dateStr
      }
      return false
    },
    [mode, value]
  )

  const isDateInRange = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        if (range.start && range.end) {
          return dateStr > range.start && dateStr < range.end
        }
      }
      return false
    },
    [mode, value]
  )

  const isRangeStart = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.start === dateStr
      }
      return false
    },
    [mode, value]
  )

  const isRangeEnd = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.end === dateStr
      }
      return false
    },
    [mode, value]
  )

  // The destructured union `onChange` is one signature per branch; the
  // runtime branches below always pair the mode with its own payload, so
  // a single internal emitter keeps the call sites total.
  const emitChange = onChange as
    | ((value: ISODate | DateRangeValue | ISOMonth | ISOYear) => void)
    | undefined

  const selectDate = React.useCallback(
    (dateStr: ISODate) => {
      // Unselectable dates never emit, in any modality (CA-SINGLE-04).
      // Request-only control otherwise — with one guard:
      // re-activating the already-selected value is not a change and
      // emits nothing (B-36 identical-value suppression, restoring
      // CA-SINGLE-03's no-emit read over the FEATURES #13 uniform-request
      // triage). No null request, not a toggle. The parent owns
      // selection; rejection leaves it unchanged, programmatic value
      // changes apply silently with no focus move.
      if (isDateUnselectable(dateStr)) return
      if (mode === 'day') {
        if (dateStr !== value) {
          emitChange?.(dateStr)
        }
      } else if (mode === 'range') {
        let nextRange: DateRangeValue
        const curr = value as DateRangeValue | null
        if (!curr || !curr.start || (curr.start && curr.end)) {
          nextRange = { start: dateStr, end: null }
        } else if (dateStr < curr.start) {
          nextRange = { start: dateStr, end: curr.start }
        } else {
          nextRange = { start: curr.start, end: dateStr }
        }
        if (
          !curr ||
          nextRange.start !== curr.start ||
          (nextRange.end ?? null) !== (curr.end ?? null)
        ) {
          emitChange?.(nextRange)
        }
      }
    },
    [mode, value, emitChange, isDateUnselectable]
  )

  const selectMonth = React.useCallback(
    (monthStr: ISOMonth) => {
      // Blocked months never emit, in any modality. Month mode selects
      // (publishing YYYY-MM with the B-36 identical guard); day/range
      // modes navigate — the view returns home when the pane commits
      // (CA-VIEW-05).
      if (isMonthDisabled(monthStr)) return
      if (mode === 'month') {
        if (monthStr !== value) {
          emitChange?.(monthStr)
        }
      } else {
        requestMonthChange(monthStr)
      }
    },
    [mode, value, emitChange, isMonthDisabled, requestMonthChange]
  )

  const selectYear = React.useCallback(
    (yearStr: ISOYear) => {
      // Blocked years never emit, in any modality. Year mode selects
      // (publishing YYYY with the B-36 identical guard); other modes
      // navigate preserving the month number (CA-VIEW-07).
      if (isYearDisabled(yearStr)) return
      if (mode === 'year') {
        if (yearStr !== value) {
          emitChange?.(yearStr)
        }
      } else {
        requestMonthChange(formatISOMonth(Number(yearStr), currentMonth.month + 1))
      }
    },
    [mode, value, emitChange, isYearDisabled, requestMonthChange, currentMonth]
  )

  // Locale-derived render data (FEATURES #3): CLDR week start, ordered
  // headers, padded grid. Guarded so an invalid locale still fails
  // closed below instead of throwing out of a hook.
  const localeData = React.useMemo(() => {
    try {
      const weekStart = getWeekStart(locale, firstDayOfWeek)
      return {
        weekStart,
        headers: getWeekdayHeaders(locale, weekStart),
        grid: buildMonthGrid(
          formatISOMonth(currentMonth.year, currentMonth.month + 1),
          weekStart,
          locale
        ),
      }
    } catch {
      return null
    }
  }, [locale, firstDayOfWeek, currentMonth])

  // Instance-local identity (CA-GRID-07, CA-ENV-01): useId is stable
  // across SSR/hydration and unique per instance; day ids append the
  // ISO date so equal dates keep their node while mounted.
  const reactId = React.useId()
  const idPrefix = React.useMemo(
    () => `cal${reactId.replace(/[^a-zA-Z0-9]/g, '')}`,
    [reactId]
  )
  const headingId = `${idPrefix}-heading`

  const contextValue = React.useMemo<CalendarContextValue>(
    () => ({
      mode,
      view,
      setView,
      value: value as CalendarValue,
      currentMonth,
      locale,
      weekStart: localeData?.weekStart ?? 0,
      headers: localeData?.headers ?? [],
      grid: localeData?.grid ?? { year: 0, month: 0, weeks: [], allDays: [] },
      headingId,
      idPrefix,
      prevDisabled,
      nextDisabled,
      prevLabel,
      nextLabel,
      markerToday,
      min,
      max,
      goToPrevMonth,
      goToNextMonth,
      requestMonthChange,
      selectDate,
      selectMonth,
      selectYear,
      isMonthDisabled,
      isYearDisabled,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
      isDateUnavailableDay,
      isDateUnselectable,
      dayRender,
    }),
    [
      mode,
      view,
      setView,
      value,
      currentMonth,
      locale,
      localeData,
      headingId,
      idPrefix,
      prevDisabled,
      nextDisabled,
      prevLabel,
      nextLabel,
      markerToday,
      min,
      max,
      goToPrevMonth,
      goToNextMonth,
      requestMonthChange,
      selectDate,
      selectMonth,
      selectYear,
      isMonthDisabled,
      isYearDisabled,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
      isDateUnavailableDay,
      isDateUnselectable,
      dayRender,
    ]
  )

  if (invalid || !localeData) {
    if (invalid) calendarDevDiagnostic(invalid)
    return null
  }

  return (
    <CalendarContext.Provider value={contextValue}>
      <Div
        data-reference-calendar=""
        data-mode={mode}
        data-view={view}
        width="65r"
        userSelect="none"
        className={className}
        style={style}
        {...props}
      >
        {children ?? (
          <>
            <CalendarHeader>
              <CalendarPrevButton />
              <CalendarHeading>
                <CalendarMonth />
                <CalendarYear />
              </CalendarHeading>
              <CalendarNextButton />
            </CalendarHeader>
            {(mode === 'day' || mode === 'range') && <CalendarGrid />}
            {mode !== 'year' && <CalendarMonths />}
            <CalendarYears />
          </>
        )}
      </Div>
    </CalendarContext.Provider>
  )
}

Calendar.Header = CalendarHeader
Calendar.Heading = CalendarHeading
Calendar.PrevButton = CalendarPrevButton
Calendar.NextButton = CalendarNextButton
Calendar.Month = CalendarMonth
Calendar.Year = CalendarYear
Calendar.Grid = CalendarGrid
Calendar.Months = CalendarMonths
Calendar.Years = CalendarYears
