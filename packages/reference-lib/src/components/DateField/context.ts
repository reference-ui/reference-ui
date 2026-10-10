/**
 * DateField's private subtree scoping: DateFieldContext carries the
 * single field's session (buffer, handlers, picker state) to its layout
 * and picker layer, while DateFieldRangeContext carries the range
 * draft (buffers, endpoints, pane) to its inputs and layer. The Calendar
 * alias reads both to bind the right machine; consumers see only parts.
 */
import * as React from 'react'
import type { DateRangeValue, ISODate } from '../Calendar'
import type { ISOMonth } from '../Calendar/dates/iso'
import type { DateFieldRangeEndpoint } from './types'

export interface DateFieldContextValue {
  value: ISODate | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  locale: string
  min?: ISODate
  max?: ISODate
  constraintInvalid: boolean
  failedBoundary: boolean
  disabled: boolean
  required: boolean
  pickerId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  buffer: string
  isDirty: boolean
  handleDateSelect: (date: ISODate | null) => void
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  handleClick: () => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
  rootInputProps: {
    placeholder?: string
    className?: string
    style?: React.CSSProperties
    id?: string
    readOnly?: boolean
    autoComplete?: string
    autoCorrect?: string
    spellCheck?: boolean
    onInput?: (e: React.FormEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void
    onCompositionStart?: (e: React.CompositionEvent<HTMLInputElement>) => void
    onCompositionEnd?: (e: React.CompositionEvent<HTMLInputElement>) => void
  }
}

export const DateFieldContext = React.createContext<DateFieldContextValue | null>(null)

export interface DateFieldRangeContextValue {
  rangeValue: DateRangeValue | null
  calendarValue: DateRangeValue | null
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  isOpen: boolean
  canApply: boolean
  activeEndpoint: DateFieldRangeEndpoint
  disabled: boolean
  readOnly: boolean
  required: boolean
  pickerId: string
  paneMonth: ISOMonth | undefined
  setPaneMonth: (month: ISOMonth) => void
  endpointRefs: Record<DateFieldRangeEndpoint, React.RefObject<HTMLInputElement | null>>
  buffers: Record<DateFieldRangeEndpoint, string>
  isDirty: boolean
  failed: boolean
  constraintInvalid: Record<DateFieldRangeEndpoint, boolean>
  handleRangeSelect: (next: DateRangeValue) => void
  handleEndpointInput: (endpoint: DateFieldRangeEndpoint, e: React.ChangeEvent<HTMLInputElement>) => void
  handleEndpointKeyDown: (
    endpoint: DateFieldRangeEndpoint,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void
  handleEndpointBlur: (endpoint: DateFieldRangeEndpoint, e: React.FocusEvent<HTMLInputElement>) => void
  handleEndpointFocus: (endpoint: DateFieldRangeEndpoint) => void
  handleEndpointClick: (endpoint: DateFieldRangeEndpoint) => void
  handleCompositionStart: (endpoint: DateFieldRangeEndpoint) => void
  handleCompositionEnd: (endpoint: DateFieldRangeEndpoint) => void
  rootHandlers: {
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void
  }
}

export const DateFieldRangeContext = React.createContext<DateFieldRangeContextValue | null>(null)
