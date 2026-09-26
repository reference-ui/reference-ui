import * as React from 'react'
import {
  Div,
  H2,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  type PrimitiveProps,
  type PrimitiveElement,
} from '@reference-ui/react'
import {
  formatISODate,
  formatISOMonth,
  getDayOfWeek,
  getDaysInMonth,
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
  parseISODate,
  parseISOMonth,
  type ISOMonth,
  type ISOYear,
} from './iso'

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
  locale?: string
  month?: ISOMonth // YYYY-MM
  onMonthChange?: (month: ISOMonth) => void
  min?: ISODate
  max?: ISODate
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
  return null
}

interface CalendarContextValue {
  mode: CalendarMode
  value: CalendarValue
  currentMonth: { year: number; month: number }
  locale: string
  /** Nav directions with no enabled target date stay disabled (FEATURES
   * #12; cluster A pins the 0001/9999 domain bounds, FEATURES #6 extends
   * this to min/max/unavailable). */
  prevDisabled: boolean
  nextDisabled: boolean
  /** Effective ISO today: valid `today` prop, else current UTC date. */
  today: ISODate
  viewMode: 'day' | 'month'
  toggleViewMode: () => void
  selectMonth: (monthIndex: number) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  selectDate: (dateStr: ISODate) => void
  isDateSelected: (dateStr: ISODate) => boolean
  isDateInRange: (dateStr: ISODate) => boolean
  isRangeStart: (dateStr: ISODate) => boolean
  isRangeEnd: (dateStr: ISODate) => boolean
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

export type CalendarHeadingProps = PrimitiveProps<'button'>

export function CalendarHeading({
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const { currentMonth, locale, toggleViewMode, viewMode } = context
  // Date.UTC maps years 0..99 onto 19xx; setUTCFullYear restores the true
  // proleptic-Gregorian year (same correction the grid kernels apply).
  const date = new Date(Date.UTC(2000, currentMonth.month, 1))
  date.setUTCFullYear(currentMonth.year)
  const monthName = date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <Button
      type="button"
      data-reference-calendar-heading=""
      onClick={toggleViewMode}
      bg="transparent"
      border="none"
      p="1r 2r"
      borderRadius="sm"
      cursor="pointer"
      fontSize="4r"
      fontWeight="600"
      m="0"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      gap="1r"
      _hover={{ bg: 'ui.button.mutedBackground' }}
      className={className}
      style={style}
      {...props}
    >
      <span>{monthName}</span>
      <span style={{ fontSize: '0.65em', opacity: 0.6 }}>{viewMode === 'month' ? '▲' : '▼'}</span>
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
      aria-label="Previous month"
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
      aria-label="Next month"
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

export type CalendarGridProps = PrimitiveProps<'table'>

export function CalendarGrid({
  className,
  style,
  ...props
}: CalendarGridProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const {
    currentMonth,
    selectDate,
    selectMonth,
    isDateSelected,
    isDateInRange,
    isRangeStart,
    isRangeEnd,
    today,
    viewMode,
  } = context

  if (viewMode === 'month') {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return (
      <Div
        data-reference-calendar-month-grid=""
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap="2r"
        py="2r"
        className={className}
        style={style}
        {...props}
      >
        {monthNames.map((mName, i) => {
          const isCurrent = i === currentMonth.month
          return (
            <Button
              key={mName}
              type="button"
              onClick={() => selectMonth(i)}
              p="2.5r 1r"
              borderRadius="sm"
              border="none"
              bg={isCurrent ? 'ui.button.background' : 'transparent'}
              color={isCurrent ? 'ui.button.foreground' : 'design.text.base'}
              fontWeight={isCurrent ? '600' : '400'}
              fontSize="3.5r"
              cursor="pointer"
              _hover={!isCurrent ? { bg: 'ui.button.mutedBackground' } : undefined}
            >
              {mName}
            </Button>
          )
        })}
      </Div>
    )
  }

  const { year, month } = currentMonth

  // Generate days in month. Gregorian kernels own in-domain years; out-of-domain
  // input (year < 1 or month outside 0..11, reachable only via adversarial
  // props) keeps the legacy Date path so behavior never changes there.
  // NOTE: years 1..99 now render proleptic-Gregorian weekdays instead of
  // Date.UTC's 1900-offset mapping — a deliberate correction, unbaselined.
  const monthInRange = month >= 0 && month <= 11
  const firstDayOfWeek =
    year >= 1 && monthInRange
      ? getDayOfWeek(year, month + 1, 1)
      : new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth =
    year >= 1 && monthInRange
      ? getDaysInMonth(year, month + 1)
      : new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const weeks: Array<Array<{ dateStr: string; dayNum: number; inMonth: boolean }>> = []
  let currentWeek: Array<{ dateStr: string; dayNum: number; inMonth: boolean }> = []

  // Prepend empty slots / previous month days
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ dateStr: '', dayNum: 0, inMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    // Canonical four-digit years (CA-ISO-08): years below 1000 must still
    // emit `YYYY-MM-DD` so grid dates validate and match controlled values.
    const dateStr = formatISODate(year, month + 1, d)

    currentWeek.push({ dateStr, dayNum: d, inMonth: true })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ dateStr: '', dayNum: 0, inMonth: false })
    }
    weeks.push(currentWeek)
  }

  const weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Deterministic initial tab target: selected in-month date, else today when
  // it renders in this pane, else the first in-month day — so a
  // selection-less pane keeps exactly one tab stop (CA-STATE-03). No per-day
  // disabled state exists yet (FEATURES #6), so every in-month day is enabled.
  const renderedDays = weeks.flatMap((week) =>
    week.filter((cell) => cell.inMonth).map((cell) => cell.dateStr)
  )
  const tabTarget =
    renderedDays.find((dateStr) => isDateSelected(dateStr)) ??
    (renderedDays.includes(today) ? today : renderedDays[0])

  return (
    <Table
      role="grid"
      data-reference-calendar-grid=""
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
          {weekDayNames.map((wd, i) => (
            <Th
              key={i}
              role="columnheader"
              fontSize="3r"
              color="design.text.light"
              p="1r 0"
              fontWeight="500"
            >
              {wd}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {weeks.map((week, wIdx) => (
          <Tr key={wIdx} role="row">
            {week.map((cell, cIdx) => {
              if (!cell.inMonth) {
                return <Td key={cIdx} role="gridcell" p="0.5r 0" />
              }

              const selected = isDateSelected(cell.dateStr)
              const inRange = isDateInRange(cell.dateStr)
              const rangeStart = isRangeStart(cell.dateStr)
              const rangeEnd = isRangeEnd(cell.dateStr)

              return (
                <Td
                  key={cIdx}
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
                    role="gridcell"
                    tabIndex={cell.dateStr === tabTarget ? 0 : -1}
                    aria-selected={selected}
                    aria-label={cell.dateStr}
                    data-date={cell.dateStr}
                    data-selected={selected ? '' : undefined}
                    data-in-range={inRange ? '' : undefined}
                    onClick={() => selectDate(cell.dateStr)}
                    width="7r"
                    height="7r"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    border="none"
                    bg={selected ? 'ui.button.background' : 'transparent'}
                    color={selected ? 'ui.button.foreground' : 'design.text.base'}
                    fontSize="3r"
                    fontWeight={selected ? '600' : '400'}
                    cursor="pointer"
                    outline="none"
                    _hover={!selected ? { bg: 'ui.button.mutedBackground' } : undefined}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
                  >
                    {cell.dayNum}
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
    locale = 'en-US',
    month: monthProp,
    onMonthChange,
    min,
    max,
    today,
    className,
    style,
    ...props
  } = calendarProps
  // Fail-closed (FEATURES #2, decided BLANK): one dev diagnostic, null
  // render. Computed before hooks; the early return below runs after all
  // hooks so hook order stays stable across valid/invalid transitions.
  const invalid = validateCalendarProps(calendarProps)
  const [viewMode, setViewMode] = React.useState<'day' | 'month'>('day')

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

  // Effective today for the grid tab target: valid `today` prop, else the
  // same current-UTC-date default the pane seed uses.
  const effectiveToday = React.useMemo<ISODate>(() => {
    if (today && isValidISODate(today)) return today
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`
  }, [today])

  const toggleViewMode = React.useCallback(() => {
    setViewMode(v => (v === 'day' ? 'month' : 'day'))
  }, [])

  // A nav direction disables exactly when its target month holds no
  // enabled in-domain date (CA-MONTH-04). Cluster A pins the Gregorian
  // domain bounds; FEATURES #6 (cluster B) extends these with min/max and
  // isDateUnavailable target-month coverage.
  const prevDisabled = currentMonth.year <= 1 && currentMonth.month <= 0
  const nextDisabled = currentMonth.year >= 9999 && currentMonth.month >= 11

  const selectMonth = React.useCallback(
    (monthIndex: number) => {
      const nextY = currentMonth.year
      const monthStr = formatISOMonth(nextY, monthIndex + 1)
      if (!monthProp) {
        setInternalMonth({ year: nextY, month: monthIndex })
      }
      onMonthChange?.(monthStr)
      setViewMode('day')
    },
    [currentMonth.year, monthProp, onMonthChange]
  )

  const goToPrevMonth = React.useCallback(() => {
    if (prevDisabled) return
    let nextY = currentMonth.year
    let nextM = currentMonth.month - 1
    if (nextM < 0) {
      nextM = 11
      nextY -= 1
    }
    const monthStr = formatISOMonth(nextY, nextM + 1)
    if (!monthProp) {
      setInternalMonth({ year: nextY, month: nextM })
    }
    onMonthChange?.(monthStr)
  }, [currentMonth, monthProp, onMonthChange, prevDisabled])

  const goToNextMonth = React.useCallback(() => {
    if (nextDisabled) return
    let nextY = currentMonth.year
    let nextM = currentMonth.month + 1
    if (nextM > 11) {
      nextM = 0
      nextY += 1
    }
    const monthStr = formatISOMonth(nextY, nextM + 1)
    if (!monthProp) {
      setInternalMonth({ year: nextY, month: nextM })
    }
    onMonthChange?.(monthStr)
  }, [currentMonth, monthProp, onMonthChange, nextDisabled])

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
      // Request-only control: every activation requests its payload once
      // (FEATURES #13 uniform-request — re-activating the selected date
      // re-requests it; there is no no-op-vs-toggle branch). The parent
      // owns selection; rejection leaves it unchanged, programmatic value
      // changes apply silently with no focus move.
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
    [mode, value, emitChange]
  )

  const contextValue = React.useMemo<CalendarContextValue>(
    () => ({
      mode,
      value: value as CalendarValue,
      currentMonth,
      locale,
      prevDisabled,
      nextDisabled,
      today: effectiveToday,
      viewMode,
      toggleViewMode,
      selectMonth,
      goToPrevMonth,
      goToNextMonth,
      selectDate,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
    }),
    [
      mode,
      value,
      currentMonth,
      locale,
      prevDisabled,
      nextDisabled,
      effectiveToday,
      viewMode,
      toggleViewMode,
      selectMonth,
      goToPrevMonth,
      goToNextMonth,
      selectDate,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
    ]
  )

  if (invalid) {
    calendarDevDiagnostic(invalid)
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
