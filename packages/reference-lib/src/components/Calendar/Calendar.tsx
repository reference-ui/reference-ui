/**
 * Calendar root: composition only. The fail-closed gate runs first, the
 * pane, availability, out-of-range, selection, today-marker, and locale
 * hooks resolve the subtree state in their original order, and the render
 * slots authored parts into their defaults. The compound assignment below
 * is the public part surface.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { CalendarContext, type CalendarContextValue } from './context'
import { useAvailability } from './hooks/use-availability'
import { useLocaleData } from './hooks/use-locale-data'
import { useOutOfRangeWarning } from './hooks/use-out-of-range'
import { usePane } from './hooks/use-pane'
import { useSelection, type CalendarEmitter } from './hooks/use-selection'
import { useTodayMarker } from './hooks/use-today-marker'
import { CalendarDay } from './parts/Day'
import { CalendarDays } from './parts/Days'
import { CalendarGrid } from './parts/Grid'
import { CalendarHeader } from './parts/Header'
import { CalendarHeading } from './parts/Heading'
import { CalendarMonth } from './parts/Month'
import { CalendarMonths } from './parts/Months'
import { CalendarNextButton } from './parts/NextButton'
import { CalendarPrevButton } from './parts/PrevButton'
import { CalendarWeekdays } from './parts/Weekdays'
import { CalendarYear } from './parts/Year'
import { CalendarYears } from './parts/Years'
import { calendarDevDiagnostic } from './shared/diagnostic'
import { isPartElement } from './shared/elements'
import { validateCalendarProps } from './shared/validate'
import type { CalendarProps, CalendarValue } from './types'

export type {
  CalendarDayRenderer,
  CalendarDayRenderState,
  CalendarDaysProps,
  CalendarDaysRenderer,
  CalendarDayProps,
  CalendarDayState,
  CalendarGridProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarMode,
  CalendarMonthProps,
  CalendarMonthsProps,
  CalendarNextButtonProps,
  CalendarPrevButtonProps,
  CalendarProps,
  CalendarSharedProps,
  CalendarValue,
  CalendarView,
  CalendarWeekdaysProps,
  CalendarYearProps,
  CalendarYearsProps,
  DateRangeValue,
  ISODate,
} from './types'
export { CalendarDay } from './parts/Day'
export { CalendarDays } from './parts/Days'
export { CalendarGrid } from './parts/Grid'
export { CalendarHeader } from './parts/Header'
export { CalendarHeading } from './parts/Heading'
export { CalendarMonth } from './parts/Month'
export { CalendarMonths } from './parts/Months'
export { CalendarNextButton } from './parts/NextButton'
export { CalendarPrevButton } from './parts/PrevButton'
export { CalendarWeekdays } from './parts/Weekdays'
export { CalendarYear } from './parts/Year'
export { CalendarYears } from './parts/Years'

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

  const {
    currentMonth,
    view,
    setView,
    requestMonthChange,
    goToPrevMonth,
    goToNextMonth,
    prevDisabled,
    nextDisabled,
    prevLabel,
    nextLabel,
  } = usePane({
    monthProp,
    value: value as CalendarValue,
    today,
    onMonthChange,
    mode,
    locale,
    min,
    max,
    isDateUnavailable,
    invalid,
  })

  const {
    isDateDisabled,
    isDateUnavailableDay,
    isDateUnselectable,
    isMonthDisabled,
    isYearDisabled,
  } = useAvailability({ min, max, isDateUnavailable })

  // Out-of-range controlled value: a dev warning only. The value keeps its
  // paint and selected ARIA while its cell is disabled. Sits before the
  // early return below so hook order stays stable across valid/invalid.
  useOutOfRangeWarning({ mode, value: value as CalendarValue, min, max, invalid })

  // The destructured union `onChange` is one signature per branch; the
  // runtime branches below always pair the mode with its own payload, so
  // a single internal emitter keeps the call sites total.
  const emitChange = onChange as CalendarEmitter

  const {
    isDateSelected,
    isDateSelectedInclusive,
    isDateInRange,
    isDateInRangeInclusive,
    isRangeStart,
    isRangeEnd,
    selectDate,
    selectMonth,
    selectYear,
  } = useSelection({
    mode,
    value: value as CalendarValue,
    emitChange,
    isDateUnselectable,
    isMonthDisabled,
    isYearDisabled,
    requestMonthChange,
    currentMonth,
  })

  const markerToday = useTodayMarker(today)

  const localeData = useLocaleData({ locale, firstDayOfWeek, currentMonth })

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
      isDateSelectedInclusive,
      isDateInRange,
      isDateInRangeInclusive,
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
      isDateSelectedInclusive,
      isDateInRange,
      isDateInRangeInclusive,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
      isDateUnavailableDay,
      isDateUnselectable,
      dayRender,
    ]
  )

  // Per-part defaulting (CA-VIEW-13): authored parts replace only their
  // own default — an authored Grid keeps the default Header/Months/Years
  // — while omitted parts render mode-gated defaults exactly as before.
  // Unrecognized children are application chrome and render after the
  // parts. Fragment wrappers are transparent to slot detection.
  const parts = React.useMemo(() => {
    const slots: {
      header?: React.ReactElement
      grid?: React.ReactElement
      months?: React.ReactElement
      years?: React.ReactElement
      chrome: React.ReactNode[]
    } = { chrome: [] }
    const collect = (nodes: React.ReactNode): void => {
      React.Children.forEach(nodes, (child) => {
        if (isPartElement(child, React.Fragment)) {
          collect((child.props as { children?: React.ReactNode }).children)
        } else if (isPartElement(child, CalendarHeader)) {
          if (!slots.header) slots.header = child
          else slots.chrome.push(child)
        } else if (isPartElement(child, CalendarGrid)) {
          if (!slots.grid) slots.grid = child
          else slots.chrome.push(child)
        } else if (isPartElement(child, CalendarMonths)) {
          if (!slots.months) slots.months = child
          else slots.chrome.push(child)
        } else if (isPartElement(child, CalendarYears)) {
          if (!slots.years) slots.years = child
          else slots.chrome.push(child)
        } else {
          slots.chrome.push(child)
        }
      })
    }
    collect(children)
    return slots
  }, [children])

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
        {parts.header ?? (
          <CalendarHeader>
            <CalendarPrevButton />
            <CalendarHeading>
              <CalendarMonth />
              <CalendarYear />
            </CalendarHeading>
            <CalendarNextButton />
          </CalendarHeader>
        )}
        {mode === 'day' || mode === 'range'
          ? (parts.grid ?? <CalendarGrid />)
          : parts.grid}
        {mode !== 'year' ? (parts.months ?? <CalendarMonths />) : parts.months}
        {parts.years ?? <CalendarYears />}
        {parts.chrome}
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
Calendar.Weekdays = CalendarWeekdays
Calendar.Days = CalendarDays
Calendar.Day = CalendarDay
Calendar.Months = CalendarMonths
Calendar.Years = CalendarYears
