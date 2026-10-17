/**
 * Calendar alias part: a Calendar bound to whichever machine hosts it —
 * the single value and handlers under a DateField, the range draft
 * (managed mode, draft value, bound pane) under a DateField.Range.
 * Caller grid props spread through; caller value/onChange/locale win.
 */
import * as React from 'react'
import { Calendar, type DateRangeValue, type ISODate } from '../../Calendar'
import { DateFieldContext, DateFieldRangeContext } from '../context'
import type { DateFieldCalendarProps } from '../types'

export function DateFieldCalendar(props: DateFieldCalendarProps) {
  const context = React.useContext(DateFieldContext)
  const rangeContext = React.useContext(DateFieldRangeContext)
  if (rangeContext && !context) {
    // Range binding: the alias drives the range Calendar (mode managed,
    // value/onChange/locale/min/max/unavailable/pane bound to the draft);
    // caller grid props spread through, caller value/onChange/locale win.
    const {
      value: callerValue,
      onChange: callerOnChange,
      locale: callerLocale,
      mode: _callerMode,
      ...rest
    } = props
    const calendarProps = {
      mode: 'range',
      value: callerValue ?? rangeContext.calendarValue,
      locale: callerLocale ?? rangeContext.locale,
      min: rangeContext.min,
      max: rangeContext.max,
      isDateUnavailable: rangeContext.isDateUnavailable,
      month: rangeContext.paneMonth,
      onMonthChange: rangeContext.setPaneMonth,
      onChange:
        callerOnChange ??
        ((nextVal: DateRangeValue) => rangeContext.handleRangeSelect(nextVal)),
      ...rest,
    } as React.ComponentPropsWithoutRef<typeof Calendar>
    return <Calendar {...calendarProps} />
  }
  // Context isDateUnavailable stays DateField-side until DateField
  // the pending change wires the bound alias; a caller-provided predicate spreads
  // through `rest` onto the Calendar isDateUnavailable prop and works today.
  // Single-spread object: Calendar props are a mode-keyed union, so
  // caller `value`/`onChange`/`locale` merge explicitly and everything
  // else spreads through. Caller props still override context, as before.
  const { value: callerValue, onChange: callerOnChange, locale: callerLocale, ...rest } = props
  const calendarProps = {
    value: callerValue ?? context?.value ?? null,
    locale: callerLocale ?? context?.locale,
    min: context?.min,
    max: context?.max,
    onChange: callerOnChange ?? ((nextVal: ISODate) => context?.handleDateSelect(nextVal)),
    ...rest,
  } as React.ComponentPropsWithoutRef<typeof Calendar>
  return <Calendar {...calendarProps} />
}
DateFieldCalendar.displayName = 'DateFieldCalendar'
