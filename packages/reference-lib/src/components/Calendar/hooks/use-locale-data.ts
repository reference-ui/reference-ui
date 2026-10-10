/**
 * Locale render data: useLocaleData resolves the CLDR week start, the
 * ordered weekday headers, and the padded month grid for the current
 * pane. Guarded so an invalid locale fails closed in the root instead of
 * throwing out of a hook.
 */
import * as React from 'react'
import { formatISOMonth, type CalendarWeekday } from '../dates/iso'
import { buildMonthGrid } from '../dates/grid'
import { getWeekStart, getWeekdayHeaders } from '../dates/week'

export interface LocaleDataOptions {
  locale: string
  firstDayOfWeek?: CalendarWeekday
  currentMonth: { year: number; month: number }
}

export function useLocaleData(options: LocaleDataOptions) {
  const { locale, firstDayOfWeek, currentMonth } = options
  return React.useMemo(() => {
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
}
