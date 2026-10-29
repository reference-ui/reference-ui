/**
 * Calendar's public contract: the mode/view/value types, the day render
 * states, the discriminated CalendarProps union, and every part's props.
 * Kept free of JSX and logic so parts, hooks, and consumers can import the
 * shape without rendering anything.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'
import type { CalendarWeekday, ISOMonth, ISOYear } from './dates/iso'

export type CalendarMode = 'day' | 'range' | 'month' | 'year'
/** Which collection the calendar shows: days, months or years. Calendar tracks
 * it itself; it is not a controlled prop. */
export type CalendarView = 'day' | 'month' | 'year'
/** A date as `YYYY-MM-DD`. */
export type ISODate = string
export interface DateRangeValue {
  start: ISODate
  end: ISODate | null
}

/** Render state for the `Day` render prop: the four flags a custom
 * day cell needs. `disabled` merges both unselectable reasons (outside
 * `min`/`max`, or refused by `isDateUnavailable`); the cell chrome —
 * button, roving tabindex, ARIA — stays lib-owned either way. */
export interface CalendarDayRenderState {
  selected: boolean
  inRange: boolean
  disabled: boolean
  today: boolean
}

/** Custom day-cell content. Return `null` (or `undefined`) to keep
 * the default locale day number. Called for every rendered day button —
 * including outside-month, disabled, and unavailable days — never for
 * void (out-of-domain) padding cells, which have no button. */
export type CalendarDayRenderer = (
  date: ISODate,
  state: CalendarDayRenderState
) => React.ReactNode

/** Render state for one date, passed to the `Calendar.Days` renderer. */
export interface CalendarDayState {
  /** The date. */
  date: ISODate
  /** The day number in the locale. */
  formattedDay: string
  /** The date belongs to the previous or next month. */
  outsideMonth: boolean
  /** The date is today. */
  today: boolean
  /** The date is selected, or inside a selected range. */
  selected: boolean
  /** Outside `min` and `max`, or unavailable. */
  disabled: boolean
  /** First date of a range. */
  rangeStart: boolean
  /** Last date of a range. */
  rangeEnd: boolean
  /** Inside a selected range, ends included. */
  inRange: boolean
  /** Inside the range being previewed. */
  preview: boolean
}

/** Renders the cell for one date from its state. Return exactly one
 * `<Calendar.Day date={day.date}>`. A missing, multiple, other or
 * date-mismatched return logs a development warning, and the cell renders
 * non-interactive. */
export type CalendarDaysRenderer = (day: CalendarDayState) => React.ReactElement

export type CalendarSharedProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  /** Required. BCP 47 locale for labels and the first day of the week. */
  locale: string
  /**
   * Overrides the week start.
   * @default the locale's default
   */
  firstDayOfWeek?: CalendarWeekday
  /**
   * The visible month as `YYYY-MM`, when you control it.
   * @default follows `value`
   */
  month?: ISOMonth
  /** Called when the user moves to another month. */
  onMonthChange?: (month: ISOMonth) => void
  /** Earliest selectable date. */
  min?: ISODate
  /** Latest selectable date. */
  max?: ISODate
  /** Dates that stay focusable but cannot be selected. */
  isDateUnavailable?: (date: ISODate) => boolean
  /** Custom content for each day button. */
  Day?: CalendarDayRenderer
  /**
   * The date marked as today. Also opens on its month when there is no value.
   * @default the browser's date
   */
  today?: ISODate
}

/** Props of Calendar. `mode` sets what a selection picks: a day, a range, a
 * month or a year. `value` is required, with `null` for empty, and `onChange`
 * receives the value type of that mode. Calendar has no `defaultValue` and no
 * `disabled`. */
export type CalendarProps =
  | (CalendarSharedProps & {
      /**
       * What a selection picks.
       * @default 'day'
       */
      mode?: 'day'
      /** Required. The controlled value. `null` is empty. */
      value: ISODate | null
      /** Called with the picked value. */
      onChange?: (value: ISODate) => void
    })
  | (CalendarSharedProps & {
      /** What a selection picks. */
      mode: 'range'
      /** Required. The controlled value. `null` is empty. */
      value: DateRangeValue | null
      /** Called with the picked value. */
      onChange?: (value: DateRangeValue) => void
    })
  | (CalendarSharedProps & {
      /** What a selection picks. */
      mode: 'month'
      /** Required. The controlled value. `null` is empty. */
      value: ISOMonth | null
      /** Called with the picked value. */
      onChange?: (value: ISOMonth) => void
    })
  | (CalendarSharedProps & {
      /** What a selection picks. */
      mode: 'year'
      /** Required. The controlled value. `null` is empty. */
      value: ISOYear | null
      /** Called with the picked value. */
      onChange?: (value: ISOYear) => void
    })

export type CalendarValue = ISODate | DateRangeValue | ISOMonth | ISOYear | null

export type CalendarHeaderProps = PrimitiveProps<'div'>

export type CalendarHeadingProps = PrimitiveProps<'div'>

export type CalendarMonthProps = PrimitiveProps<'button'>

export type CalendarYearProps = PrimitiveProps<'button'>

export type CalendarPrevButtonProps = PrimitiveProps<'button'>

export type CalendarNextButtonProps = PrimitiveProps<'button'>

export type CalendarWeekdaysProps = Omit<PrimitiveProps<'thead'>, 'children'> & {
  ref?: React.Ref<HTMLTableSectionElement>
}

export type CalendarDaysProps = Omit<PrimitiveProps<'tbody'>, 'children'> & {
  /** Returns the `Calendar.Day` for one date. Leave it out for default days. */
  children?: CalendarDaysRenderer
  ref?: React.Ref<HTMLTableSectionElement>
}

export type CalendarDayProps = Omit<PrimitiveProps<'button'>, 'children'> & {
  /** Required. Must equal the `date` it was rendered for. */
  date: ISODate
  /** The button content. */
  children?: React.ReactNode
  /** Data attributes the day sets itself. They are declared so a value you
   * pass typechecks, but the day's own value always wins. */
  'data-date'?: string
  'data-selected'?: string
  'data-in-range'?: string
  'data-outside-month'?: string
  'data-today'?: string
  'data-disabled'?: string
  'data-unavailable'?: string
  'data-focused'?: string
  'data-range-start'?: string
  'data-range-end'?: string
}

export type CalendarGridProps = PrimitiveProps<'table'> & {
  ref?: React.Ref<HTMLTableElement>
}

export type CalendarMonthsProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  ref?: React.Ref<HTMLDivElement>
}

export type CalendarYearsProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  ref?: React.Ref<HTMLDivElement>
}
