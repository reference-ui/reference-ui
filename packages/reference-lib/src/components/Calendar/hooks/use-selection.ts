/**
 * Selection: useSelection wraps the committed matchers and the three
 * activators into stable callbacks. Days publish ISO with the identical
 * guard, ranges fold through the completion machine, and month/year
 * activation selects in its own mode while navigating otherwise —
 * unselectable units never emitting in any modality.
 */
import * as React from 'react'
import { formatISOMonth, type ISOMonth, type ISOYear } from '../dates/iso'
import {
  matchInRange,
  matchInRangeInclusive,
  matchRangeEnd,
  matchRangeStart,
  matchSelected,
  matchSelectedInclusive,
} from '../selection/matchers'
import { resolveRangeSelect } from '../selection/ranges'
import type {
  CalendarMode,
  CalendarValue,
  DateRangeValue,
  ISODate,
} from '../types'

export type CalendarEmitter =
  | ((value: ISODate | DateRangeValue | ISOMonth | ISOYear) => void)
  | undefined

export interface SelectionOptions {
  mode: CalendarMode
  value: CalendarValue
  emitChange: CalendarEmitter
  isDateUnselectable: (dateStr: ISODate) => boolean
  isMonthDisabled: (monthStr: ISOMonth) => boolean
  isYearDisabled: (yearStr: ISOYear) => boolean
  requestMonthChange: (monthStr: ISOMonth) => void
  currentMonth: { year: number; month: number }
}

export function useSelection(options: SelectionOptions) {
  const {
    mode,
    value,
    emitChange,
    isDateUnselectable,
    isMonthDisabled,
    isYearDisabled,
    requestMonthChange,
    currentMonth,
  } = options

  const isDateSelected = React.useCallback(
    (dateStr: ISODate) => matchSelected(mode, value, dateStr),
    [mode, value]
  )

  const isDateSelectedInclusive = React.useCallback(
    (dateStr: ISODate) => matchSelectedInclusive(mode, value, dateStr),
    [mode, value]
  )

  const isDateInRange = React.useCallback(
    (dateStr: ISODate) => matchInRange(mode, value, dateStr),
    [mode, value]
  )

  const isDateInRangeInclusive = React.useCallback(
    (dateStr: ISODate) => matchInRangeInclusive(mode, value, dateStr),
    [mode, value]
  )

  const isRangeStart = React.useCallback(
    (dateStr: ISODate) => matchRangeStart(mode, value, dateStr),
    [mode, value]
  )

  const isRangeEnd = React.useCallback(
    (dateStr: ISODate) => matchRangeEnd(mode, value, dateStr),
    [mode, value]
  )

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
        const nextRange = resolveRangeSelect(
          value as DateRangeValue | null,
          dateStr,
          isDateUnselectable
        )
        if (nextRange) {
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

  return {
    isDateSelected,
    isDateSelectedInclusive,
    isDateInRange,
    isDateInRangeInclusive,
    isRangeStart,
    isRangeEnd,
    selectDate,
    selectMonth,
    selectYear,
  }
}
