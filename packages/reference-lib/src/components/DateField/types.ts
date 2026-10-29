/**
 * DateField's public contract: the single and range root props, the
 * endpoint and name types, and every part's props. Kept free of JSX and
 * logic so parts, hooks, and consumers can import the shape without
 * rendering anything.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'
import type { Overlay, OverlayContentProps } from '../Overlay'
import type {
  Calendar,
  CalendarMode,
  DateRangeValue,
  ISODate,
} from '../Calendar'
import type { ISOMonth, ISOYear } from '../Calendar/dates/iso'

export type DateFieldProps = Omit<PrimitiveProps<'input'>, 'onChange' | 'value' | 'defaultValue'> & {
  /** Required. The controlled date. `null` is empty. */
  value: ISODate | null
  /** Required. Called with the new date, or `null` when cleared. */
  onChange: (value: ISODate | null) => void
  /** Required. BCP 47 locale for the text format. */
  locale: string
  /** Earliest allowed date. */
  min?: ISODate
  /** Latest allowed date. */
  max?: ISODate
  /** Dates that cannot be chosen. */
  isDateUnavailable?: (date: ISODate) => boolean
  /**
   * Disables the input and the trigger.
   * @default false
   */
  disabled?: boolean
  /**
   * Shows the value but blocks typing and arrow stepping.
   * @default false
   */
  readOnly?: boolean
  /**
   * Marks the input required.
   * @default false
   */
  required?: boolean
  /** Submits the value with a form. */
  name?: string
  /** The `id` of the form to submit with. */
  form?: string
  /** Placeholder text for the input. */
  placeholder?: string
}

export type DateFieldRangeEndpoint = 'start' | 'end'
export type DateFieldRangeName = { start?: string; end?: string }

export type DateFieldRangeProps = Omit<
  PrimitiveProps<'div'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  /** Required. `{ start, end }`, or `null`. */
  value: DateRangeValue | null
  /** Required. Called with a complete range, or `null`. */
  onChange: (value: DateRangeValue | null) => void
  /** Required. BCP 47 locale for the text format. */
  locale: string
  /** Earliest allowed date. */
  min?: ISODate
  /** Latest allowed date. */
  max?: ISODate
  /** Dates that cannot be chosen. */
  isDateUnavailable?: (date: ISODate) => boolean
  /**
   * Disables the inputs and the trigger.
   * @default false
   */
  disabled?: boolean
  /**
   * Shows the value but blocks typing and arrow stepping.
   * @default false
   */
  readOnly?: boolean
  /**
   * Marks the inputs required.
   * @default false
   */
  required?: boolean
  /** One name for both dates, or a name each. */
  name?: string | DateFieldRangeName
  /** The `id` of the form to submit with. */
  form?: string
}

export type DateFieldInputProps = PrimitiveProps<'input'>

export type DateFieldTriggerProps = React.ComponentPropsWithoutRef<typeof Overlay.Trigger>

export type DateFieldPickerProps = OverlayContentProps

export type DateFieldCalendarProps = Omit<
  React.ComponentPropsWithoutRef<typeof Calendar>,
  | 'value'
  | 'onChange'
  | 'locale'
  | 'mode'
  | 'min'
  | 'max'
  | 'isDateUnavailable'
  | 'month'
  | 'onMonthChange'
> & {
  mode?: CalendarMode
  value?: ISODate | DateRangeValue | ISOMonth | ISOYear | null
  onChange?: ((value: ISODate) => void) | ((value: DateRangeValue) => void) | ((value: ISOMonth) => void) | ((value: ISOYear) => void)
  locale?: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  month?: ISOMonth
  onMonthChange?: (month: ISOMonth) => void
}

export type DateFieldStartProps = PrimitiveProps<'input'>

export type DateFieldEndProps = PrimitiveProps<'input'>
