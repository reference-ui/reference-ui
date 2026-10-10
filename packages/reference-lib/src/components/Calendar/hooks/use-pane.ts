/**
 * Pane and navigation: usePane owns the shown month (controlled or
 * internal), the value-following effect, the private view with its
 * month/mode reset, the nav-target model (a direction disables exactly
 * when its target month holds no enabled in-domain date), and the single
 * request seam the nav buttons, outside days, and Page keys share.
 */
import * as React from 'react'
import {
  formatISODate,
  formatISOMonth,
  getDaysInMonth,
  isValidISODate,
  isValidISOMonth,
  parseISODate,
  parseISOMonth,
  type ISOMonth,
} from '../dates/iso'
import { getHomeView, monthFromValue, shiftMonth, systemMonth } from '../dates/pane'
import { formatMonthYear } from '../shared/format'
import type { CalendarMode, CalendarValue, CalendarView, ISODate } from '../types'

export interface PaneOptions {
  monthProp?: ISOMonth
  value: CalendarValue
  today?: ISODate
  onMonthChange?: (month: ISOMonth) => void
  mode: CalendarMode
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  invalid: string | null
}

export function usePane(options: PaneOptions) {
  const {
    monthProp,
    value,
    today,
    onMonthChange,
    mode,
    locale,
    min,
    max,
    isDateUnavailable,
    invalid,
  } = options

  // Uncontrolled pane seed (FEATURES #12): value, else today, else the
  // system month. Total — invalid props fall through to the next source
  // so an invalid→valid transition never strands garbage month state.
  const [internalMonth, setInternalMonth] = React.useState(() => {
    if (monthProp && isValidISOMonth(monthProp)) {
      const { year, month } = parseISOMonth(monthProp)
      return { year, month: month - 1 }
    }
    return (
      monthFromValue(value) ??
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
    () => (monthProp === undefined ? monthFromValue(value) : null),
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

  return {
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
  }
}
