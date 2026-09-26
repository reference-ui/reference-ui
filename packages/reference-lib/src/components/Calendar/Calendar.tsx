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
export type ISODate = string // YYYY-MM-DD
export interface DateRangeValue {
  start: ISODate
  end: ISODate | null
}

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
  /** Per-date availability predicate (FEATURES #6). Combined with
   * `min`/`max` into one non-interactive day state; called only with
   * valid canonical in-domain dates. */
  isDateUnavailable?: (date: ISODate) => boolean
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
  return null
}

interface CalendarContextValue {
  mode: CalendarMode
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
  isDateSelected: (dateStr: ISODate) => boolean
  isDateInRange: (dateStr: ISODate) => boolean
  isRangeStart: (dateStr: ISODate) => boolean
  isRangeEnd: (dateStr: ISODate) => boolean
  /** Single non-interactive day state (FEATURES #6): outside min/max or
   * refused by isDateUnavailable. Never called with out-of-domain dates. */
  isDateDisabled: (dateStr: ISODate) => boolean
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
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  // Locale-formatted div + the stable polite atomic announcement source
  // (FEATURES #11): one text mutation per accepted month, no global
  // announcer. Sync text — never effect-written — so mount produces no
  // redundant post-mount mutation (CA-GRID-12). The prototype heading
  // drill-down toggle is gone with the button host; Month/Year parts own
  // view when FEATURES #10 lands.
  const { currentMonth, locale, headingId } = context
  const monthName = formatMonthYear(locale, currentMonth.year, currentMonth.month)

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
      className={className}
      style={style}
      {...props}
    >
      {monthName}
    </Div>
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
  const navDisabled = context?.prevDisabled ?? false

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
  const navDisabled = context?.nextDisabled ?? false

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

  // Preferred roving target (CA-STATE-03): enabled rendered selection,
  // then enabled rendered today, then the first enabled in-month day,
  // then the first enabled rendered day. Null when nothing is enabled —
  // no artificial tab stop (CA-STATE-07).
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

  // Nearest enabled rendered date to a lost target, forward-first
  // (CA-DYNAMIC-02: April 10 → April 11), else null.
  const nearestEnabled = React.useCallback(
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
              ? nearestEnabled(focusedDate)
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
        // Committed but unusable (disabled/removed) → drop and relocate
        // to one valid tab target without stealing focus (CA-KEY-10).
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
    // Disabled in place → nearest (CA-DYNAMIC-02); unrendered (month or
    // locale moved on) → preferred target (CA-DYNAMIC-03, CA-LOC-07).
    // DOM focus follows only when it was grid-owned: live in the grid,
    // or dropped by the same commit's disable/unmount.
    const next =
      focusedDate && renderedSet.has(focusedDate)
        ? nearestEnabled(focusedDate)
        : computePreferredTarget()
    if (next !== focusedDate) {
      setFocusedDate(next)
      if (next && (focusInGrid() || hadGridFocusRef.current)) focusDay(next)
    }
  })

  // Disabled-date skip: walk from the candidate while blocked, stopping
  // at the inclusive bounds without wrapping (CA-KEY-05). The step cap
  // terminates fully-blocked spans instead of looping (CA-KEY-06); ten
  // thousand days covers any plausible constraint window.
  const skipToEnabled = (
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
        candidate = skipToEnabled(
          addCalendarDays(origin as CanonicalISODate, vertical ? step * 7 : step),
          dirOrStep,
          minBound,
          maxBound
        )
      } catch {
        candidate = null
      }
    } else if (key === 'Home' || key === 'End') {
      // Locale week boundary (CA-KEY-02); blocked boundary dates skip
      // inward toward the origin week interior.
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
        candidate = skipToEnabled(
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
    if (isDateDisabled(cell.date)) return // locked out in every modality (CA-SINGLE-04)
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
      style={style}
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
              const isToday = markerToday === cell.date
              const isFocused = focusedDate === cell.date

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
                    tabIndex={isFocused ? 0 : -1}
                    disabled={disabled}
                    aria-disabled={disabled ? 'true' : undefined}
                    aria-selected={selected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={cell.accessibleName}
                    data-date={cell.date}
                    data-selected={selected ? '' : undefined}
                    data-in-range={inRange ? '' : undefined}
                    data-outside-month={cell.outsideMonth ? '' : undefined}
                    data-today={isToday ? '' : undefined}
                    data-disabled={disabled ? '' : undefined}
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
                        : disabled || cell.outsideMonth
                          ? 'design.text.light'
                          : 'design.text.base'
                    }
                    fontSize="3r"
                    fontWeight={selected || isToday ? '600' : '400'}
                    textDecoration={isToday ? 'underline' : undefined}
                    textUnderlineOffset={isToday ? '0.15em' : undefined}
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    outline="none"
                    _hover={!selected && !disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
                  >
                    {cell.formattedDay}
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

  // Single non-interactive day state (FEATURES #6): outside the
  // canonical bounds or refused by the predicate. Lexical comparison is
  // exact here — bounds passed the CA-ISO-04 canonical gate and grid
  // dates are canonical by construction.
  const isDateDisabled = React.useCallback(
    (dateStr: ISODate) => {
      if (min !== undefined && dateStr < min) return true
      if (max !== undefined && dateStr > max) return true
      return isDateUnavailable?.(dateStr) ?? false
    },
    [min, max, isDateUnavailable]
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
    if (prevDisabled || !prevTarget) return
    requestMonthChange(formatISOMonth(prevTarget.year, prevTarget.month + 1))
  }, [prevDisabled, prevTarget, requestMonthChange])

  const goToNextMonth = React.useCallback(() => {
    if (nextDisabled || !nextTarget) return
    requestMonthChange(formatISOMonth(nextTarget.year, nextTarget.month + 1))
  }, [nextDisabled, nextTarget, requestMonthChange])

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
  // runtime branch below always pairs the mode with its own payload, so a
  // single internal emitter keeps the call sites total.
  const emitChange = onChange as ((value: ISODate | DateRangeValue) => void) | undefined

  const selectDate = React.useCallback(
    (dateStr: ISODate) => {
      // Blocked dates never emit, in any modality (FEATURES #6,
      // CA-SINGLE-04). Request-only control otherwise: every activation
      // requests its payload once (FEATURES #13 uniform-request —
      // re-activating the selected date re-requests it; there is no
      // no-op-vs-toggle branch). The parent owns selection; rejection
      // leaves it unchanged, programmatic value changes apply silently
      // with no focus move.
      if (isDateDisabled(dateStr)) return
      if (mode === 'day') {
        emitChange?.(dateStr)
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
        emitChange?.(nextRange)
      }
    },
    [mode, value, emitChange, isDateDisabled]
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
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
    }),
    [
      mode,
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
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
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
              <CalendarHeading />
              <CalendarNextButton />
            </CalendarHeader>
            <CalendarGrid />
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
Calendar.Grid = CalendarGrid
