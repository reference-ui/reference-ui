/**
 * DateField root: composition only. The required-prop guards run first,
 * the edit session resolves the buffer and handlers, and the render
 * hosts the compound parts through the slot provider — or the childless
 * input when no children are authored. The compound assignment below is
 * the public part surface, including the Range host and its endpoints.
 */
import * as React from 'react'
import { Div, Input } from '@reference-ui/react'
import { Overlay } from '../Overlay'
import { isValidISODate } from '../Calendar/dates/iso'
import { DateFieldContext, type DateFieldContextValue } from './context'
import {
  DateFieldEnd,
  DateFieldRange,
  DateFieldStart,
} from './DateFieldRange'
import { assertValidDateBounds, formatLocalDate } from './engine/parse'
import { useEditSession } from './hooks/use-edit-session'
import { DateFieldCalendar } from './parts/Calendar'
import { DateFieldInput } from './parts/Input'
import { DateFieldPicker } from './parts/Picker'
import { DateFieldLayout } from './parts/SingleLayout'
import { DateFieldPickerLayer } from './parts/SinglePickerLayer'
import { DateFieldTrigger } from './parts/Trigger'
import { DateFieldSlotProvider } from './slots/slots'
import type { DateFieldProps } from './types'

export type {
  DateFieldCalendarProps,
  DateFieldInputProps,
  DateFieldPickerProps,
  DateFieldProps,
  DateFieldTriggerProps,
} from './types'
export { DateFieldCalendar } from './parts/Calendar'
export { DateFieldInput } from './parts/Input'
export { DateFieldPicker } from './parts/Picker'
export { DateFieldTrigger } from './parts/Trigger'

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(
    {
      children,
      value,
      onChange,
      locale,
      min,
      max,
      isDateUnavailable,
      disabled = false,
      readOnly = false,
      required = false,
      name,
      form,
      placeholder,
      className,
      style,
      ...props
    },
    ref
  ) {
    if (locale == null) {
      throw new Error('[reference-ui] DateField requires an explicit locale prop.')
    }
    assertValidDateBounds(min, max)
    if (value === undefined) {
      throw new Error('[reference-ui] DateField requires an explicit value prop (null is the empty value).')
    }
    if (onChange == null) {
      throw new Error('[reference-ui] DateField requires an explicit onChange prop.')
    }

    const [isOpen, setIsOpen] = React.useState(false)

    const {
      constraintInvalid,
      buffer,
      isDirty,
      hasFailedBoundary,
      resetEpoch,
      inputRef,
      handleDateSelect,
      handleInput,
      handleKeyDown,
      handleBlur,
      handleClick,
      handleCompositionStart,
      handleCompositionEnd,
    } = useEditSession({
      value,
      onChange,
      locale,
      min,
      max,
      isDateUnavailable,
      disabled,
      readOnly,
      isOpen,
      setIsOpen,
    })

    const reactId = React.useId()
    const [pickerId] = React.useState(() => `datefield-picker-${reactId.replace(/:/g, '')}`)

    const fieldRef = React.useRef<HTMLDivElement | null>(null)

    const rootInputProps = React.useMemo<DateFieldContextValue['rootInputProps']>(
      () => ({
        placeholder,
        className,
        style,
        id: (props as Record<string, any>).id,
        readOnly,
        autoComplete: (props as Record<string, any>).autoComplete,
        autoCorrect: (props as Record<string, any>).autoCorrect,
        spellCheck: (props as Record<string, any>).spellCheck,
        onInput: (props as Record<string, any>).onInput,
        onKeyDown: (props as Record<string, any>).onKeyDown,
        onFocus: (props as Record<string, any>).onFocus,
        onBlur: (props as Record<string, any>).onBlur,
        onClick: (props as Record<string, any>).onClick,
        onCompositionStart: (props as Record<string, any>).onCompositionStart,
        onCompositionEnd: (props as Record<string, any>).onCompositionEnd,
      }),
      [placeholder, className, style, props, readOnly]
    )

    const contextValue = React.useMemo<DateFieldContextValue>(
      () => ({
        value,
        isOpen,
        setIsOpen,
        locale,
        min,
        max,
        constraintInvalid,
        failedBoundary: hasFailedBoundary,
        disabled,
        required,
        pickerId,
        inputRef,
        buffer,
        isDirty,
        handleDateSelect,
        handleInput,
        handleKeyDown,
        handleBlur,
        handleClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootInputProps,
      }),
      [
        value,
        isOpen,
        locale,
        min,
        max,
        constraintInvalid,
        hasFailedBoundary,
        disabled,
        required,
        pickerId,
        inputRef,
        buffer,
        isDirty,
        handleDateSelect,
        handleInput,
        handleKeyDown,
        handleBlur,
        handleClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootInputProps,
      ]
    )

    const composedFieldRef = (node: HTMLDivElement | null) => {
      fieldRef.current = node
      if (typeof ref === 'function') {
        ref(node as any)
      } else if (ref && typeof ref === 'object') {
        ;(ref as any).current = node
      }
    }

    const composedChildlessRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node as any)
      } else if (ref && typeof ref === 'object') {
        ;(ref as any).current = node
      }
    }

    if (!children) {
      const childlessProps = props as Record<string, any>
      const childlessAriaInvalid = childlessProps['aria-invalid']
      // Same engine display/invalid/empty as the compound host.
      const childlessDisplay = isDirty
        ? buffer
        : value == null
          ? ''
          : isValidISODate(value)
            ? formatLocalDate(value, locale)
            : value
      const childlessInvalid = constraintInvalid || hasFailedBoundary
      const childlessEmpty = isDirty ? buffer === '' : value === null
      return (
        <>
          <Input
            ref={composedChildlessRef}
            {...props}
            type="text"
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            value={childlessDisplay}
            onInput={childlessProps.onInput}
            onChange={(e) => {
              childlessProps.onChange?.(e)
              handleInput(e)
            }}
            onKeyDown={(e) => {
              childlessProps.onKeyDown?.(e)
              if (!e.defaultPrevented && !disabled) handleKeyDown(e)
            }}
            onFocus={childlessProps.onFocus}
            onBlur={(e) => {
              childlessProps.onBlur?.(e)
              if (!e.defaultPrevented && !disabled) handleBlur(e)
            }}
            onClick={(e) => {
              childlessProps.onClick?.(e)
              if (!e.defaultPrevented && !disabled) handleClick()
            }}
            onCompositionStart={(e) => {
              childlessProps.onCompositionStart?.(e)
              handleCompositionStart()
            }}
            onCompositionEnd={(e) => {
              childlessProps.onCompositionEnd?.(e)
              handleCompositionEnd()
            }}
            placeholder={placeholder}
            className={className}
            style={style}
            aria-invalid={childlessInvalid ? true : childlessAriaInvalid}
            data-invalid={childlessInvalid ? 'true' : undefined}
            data-editing={isDirty ? 'true' : undefined}
            data-empty={childlessEmpty ? 'true' : undefined}
          />
          {name && !disabled && (
            <input key={`hidden-${resetEpoch}`} type="hidden" name={name} value={value ?? ''} form={form} />
          )}
        </>
      )
    }

    const {
      id: _wrapperId,
      onInput: _wrapperOnInput,
      onKeyDown: _wrapperOnKeyDown,
      onFocus: _wrapperOnFocus,
      onBlur: _wrapperOnBlur,
      onClick: _wrapperOnClick,
      onCompositionStart: _wrapperOnCompositionStart,
      onCompositionEnd: _wrapperOnCompositionEnd,
      autoComplete: _wrapperAutoComplete,
      autoCorrect: _wrapperAutoCorrect,
      spellCheck: _wrapperSpellCheck,
      ...wrapperProps
    } = props

    return (
      <DateFieldSlotProvider>
        <DateFieldContext.Provider value={contextValue}>
          <Overlay open={isOpen} onOpenChange={setIsOpen} anchor={fieldRef} isolation={false}>
            <Div
              ref={composedFieldRef}
              data-reference-field=""
              display="inline-flex"
              alignItems="center"
              width="100%"
              className={className}
              style={style}
              {...wrapperProps}
            >
              {children}
              <DateFieldLayout />
            </Div>
            <DateFieldPickerLayer />
            {name && !disabled && (
              <input key={`hidden-${resetEpoch}`} type="hidden" name={name} value={value ?? ''} form={form} />
            )}
          </Overlay>
        </DateFieldContext.Provider>
      </DateFieldSlotProvider>
    )
  }
) as React.ForwardRefExoticComponent<DateFieldProps & React.RefAttributes<HTMLInputElement>> & {
  Input: typeof DateFieldInput
  Trigger: typeof DateFieldTrigger
  Picker: typeof DateFieldPicker
  Calendar: typeof DateFieldCalendar
  Range: typeof DateFieldRange
  Start: typeof DateFieldStart
  End: typeof DateFieldEnd
}

DateField.Input = DateFieldInput
DateField.Trigger = DateFieldTrigger
DateField.Picker = DateFieldPicker
DateField.Calendar = DateFieldCalendar
DateField.Range = DateFieldRange
DateField.Start = DateFieldStart
DateField.End = DateFieldEnd
