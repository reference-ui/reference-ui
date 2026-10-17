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
/** Calendar-private interaction state (FEATURES #10): which collection is
 * shown. Never a controlled prop — the application does not branch on it. */
export type CalendarView = 'day' | 'month' | 'year'
export type ISODate = string // YYYY-MM-DD
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

/** Exact per-day render state for the `Calendar.Days` renderer (FEATURES
 * #5, CA-DAY-02/03/04): ten fields, no more. `disabled` merges both
 * unselectable reasons (outside `min`/`max`, or refused by
 * `isDateUnavailable`); `selected`/`inRange` are inclusive over committed
 * ranges (endpoints and interior alike); `preview` marks the transient
 * hover/focus band of a pending range, which never touches `selected`. */
export interface CalendarDayState {
  date: ISODate
  formattedDay: string
  outsideMonth: boolean
  today: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
  preview: boolean
}

/** Custom day-cell renderer (FEATURES #5): called once per rendered date
 * with its exact ten-field state. Must return exactly one
 * `<Calendar.Day date={day.date}>` — a missing, multiple, foreign, or
 * date-mismatched return emits one dev diagnostic and renders that cell
 * non-interactive (CA-DAY-08..11). The `ReactElement` return keeps
 * nullish/multiple returns a type error; runtime casts still diagnose. */
export type CalendarDaysRenderer = (day: CalendarDayState) => React.ReactElement

export type CalendarSharedProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  /** Required BCP 47 locale (FEATURES #3): drives headers, grid padding,
   * week boundaries, and every label. There is no default:
   * a server-environment-dependent fallback is forbidden. */
  locale: string
  /** Optional weekday-token override for the locale's CLDR week start
   * (FEATURES #3). Short kit tokens (`'sun'`…`'sat'`); an unrecognized
   * runtime value falls back to the locale default per the pinned kit. */
  firstDayOfWeek?: CalendarWeekday
  month?: ISOMonth // YYYY-MM
  onMonthChange?: (month: ISOMonth) => void
  min?: ISODate
  max?: ISODate
  /** Per-date availability predicate (exact React Aria name +
   * semantics). An unavailable date stays focusable — roving tabindex,
   * arrows, Home/End, and Page keys all land on it — but is unselectable
   * in every modality (`aria-disabled`, greyed, `data-unavailable`, never
   * emits). Out-of-`min`/`max` dates keep the stronger state: natively
   * disabled and skipped by keyboard. Called only with valid canonical
   * in-domain dates. */
  isDateUnavailable?: (date: ISODate) => boolean
  /** Custom day-cell content: `Day={(date, state) => node}`.
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
  /** Day renderer over the exact ten-field state (FEATURES #5). Omitted
   * children render default locale day numbers. */
  children?: CalendarDaysRenderer
  ref?: React.Ref<HTMLTableSectionElement>
}

export type CalendarDayProps = Omit<PrimitiveProps<'button'>, 'children'> & {
  /** The rendered date: must exactly match the `Calendar.Days`
   * render-state date (CA-DAY-08 exactness). Never spread onto the
   * button. */
  date: ISODate
  children?: React.ReactNode
  /** Managed data attributes (CA-DAY-06): declared so conflicting
   * consumer values typecheck; the managed value always wins. */
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
