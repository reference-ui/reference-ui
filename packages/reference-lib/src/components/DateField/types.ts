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
  value: ISODate | null
  onChange: (value: ISODate | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  name?: string
  form?: string
}

export type DateFieldRangeEndpoint = 'start' | 'end'
export type DateFieldRangeName = { start?: string; end?: string }

export type DateFieldRangeProps = Omit<
  PrimitiveProps<'div'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  value: DateRangeValue | null
  onChange: (value: DateRangeValue | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string | DateFieldRangeName
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
