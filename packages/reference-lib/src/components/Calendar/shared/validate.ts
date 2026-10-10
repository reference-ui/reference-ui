/**
 * Fail-closed prop gate: validateCalendarProps returns the single dev
 * diagnostic when any date-like prop is invalid, min/max contradict, or
 * the mode/value shape mismatches — else null. The root renders null on
 * a message, so no grid and no callback can escape an invalid fixture.
 */
import {
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
} from '../dates/iso'
import { validateLocale } from '../dates/week'
import type { CalendarProps, DateRangeValue } from '../types'

export function validateCalendarProps(props: CalendarProps): string | null {
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
