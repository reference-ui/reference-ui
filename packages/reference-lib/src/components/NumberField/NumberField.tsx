import * as React from 'react'
import { Div, Input, Button, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

// Float-drift cleanup ported verbatim from quarantine (NF-MATH-07/08/14):
// snaps ordinary decimal stepping (0.1 + 0.2) back to the representable
// value only when within float epsilon, and canonicalizes -0 to 0.
function cleanFloat(value: number): number {
  if (!Number.isFinite(value)) return value
  const rounded = parseFloat(value.toPrecision(15))
  if (
    Math.abs(rounded - value) <=
    Math.min(Number.EPSILON * Math.max(1, Math.abs(value)), 1e-10)
  ) {
    return Object.is(rounded, -0) ? 0 : rounded
  }
  return Object.is(value, -0) ? 0 : value
}

export type NumberFieldProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: number | null
  defaultValue?: number | null
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  locale?: string
}

interface NumberFieldContextValue {
  value: number | null
  min?: number
  max?: number
  step: number
  disabled: boolean
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  focusInput: () => void
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null)

export type NumberFieldInputProps = PrimitiveProps<'input'>

export const NumberFieldInput = React.forwardRef<HTMLInputElement, NumberFieldInputProps>(
  function NumberFieldInput(
    {
      className,
      style,
      onKeyDown: userOnKeyDown,
      onChange: userOnChange,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) return null

    const { value, min, max, disabled, handleInputChange, handleKeyDown, inputRef } = context

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting consumer casts cannot break the spinbutton.
    // Unrelated props (readOnly, aria-invalid, aria-label, data-*) pass
    // through untouched (NF-DOM-05).
    const {
      type: _managedType,
      role: _managedRole,
      value: _managedValue,
      defaultValue: _managedDefaultValue,
      inputMode: _managedInputMode,
      min: _managedMin,
      max: _managedMax,
      step: _managedStep,
      disabled: _managedDisabled,
      'aria-valuenow': _managedNow,
      'aria-valuemin': _managedMinAttr,
      'aria-valuemax': _managedMaxAttr,
      'aria-valuetext': _managedText,
      ...restProps
    } = props as Record<string, unknown>

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (inputRef) {
          ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref, inputRef]
    )

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      userOnKeyDown?.(e)
      if (!e.defaultPrevented) {
        handleKeyDown(e)
      }
    }

    // Consumer edit handlers run first in native order; cancellation at the
    // cancelable boundary suppresses managed work (NF-EDIT-13, NF-KEY-07).
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      userOnChange?.(e)
      if (!e.defaultPrevented) {
        handleInputChange(e)
      }
    }

    return (
      <Input
        ref={setInputRef}
        type="text"
        role="spinbutton"
        inputMode="decimal"
        aria-valuenow={value !== null ? value : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        value={value !== null ? String(value) : ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={userOnFocus}
        onBlur={userOnBlur}
        className={className}
        style={style}
        {...restProps}
      />
    )
  }
)

export type NumberFieldIncrementProps = PrimitiveProps<'button'>

export const NumberFieldIncrement = React.forwardRef<HTMLButtonElement, NumberFieldIncrementProps>(
  function NumberFieldIncrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      type: _managedType,
      tabIndex: _managedTabIndex,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)

    // Capability follows root state or authored disabled (NF-STEP-11);
    // structural type/tabIndex stay managed (NF-TYPE-03) while aria-label
    // remains consumer-overridable via the trailing spread.
    const isDisabled = context?.disabled || authoredDisabled || false

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      // Secondary/auxiliary buttons stay native, never step (NF-STEP-09).
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled) {
        e.preventDefault()
        context?.focusInput()
      }
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled) {
        context?.increment()
        context?.focusInput()
      }
    }

    return (
      <Button
        ref={ref}
        type="button"
        tabIndex={-1}
        aria-label="Increment"
        disabled={isDisabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

export type NumberFieldDecrementProps = PrimitiveProps<'button'>

export const NumberFieldDecrement = React.forwardRef<HTMLButtonElement, NumberFieldDecrementProps>(
  function NumberFieldDecrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      type: _managedType,
      tabIndex: _managedTabIndex,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)

    // Capability follows root state or authored disabled (NF-STEP-11);
    // structural type/tabIndex stay managed (NF-TYPE-03) while aria-label
    // remains consumer-overridable via the trailing spread.
    const isDisabled = context?.disabled || authoredDisabled || false

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      // Secondary/auxiliary buttons stay native, never step (NF-STEP-09).
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled) {
        e.preventDefault()
        context?.focusInput()
      }
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled) {
        context?.decrement()
        context?.focusInput()
      }
    }

    return (
      <Button
        ref={ref}
        type="button"
        tabIndex={-1}
        aria-label="Decrement"
        disabled={isDisabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

export const NumberField = React.forwardRef<HTMLDivElement, NumberFieldProps>(
  function NumberField(
    {
      children,
      value: valueProp,
      defaultValue = null,
      onChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      disabled = false,
      locale = 'en-US',
      className,
      style,
      ...props
    },
    ref
  ) {
    // Runtime validation of numeric props (NF-MATH-02, adapted): fail fast
    // on NaN/unusable props instead of poisoning state. Unlike quarantine,
    // ±Infinity bounds stay legal — they are this engine's unbounded
    // sentinels (the defaults). Render-phase pure checks: StrictMode-safe.
    if (valueProp !== undefined && valueProp !== null && !Number.isFinite(valueProp)) {
      throw new Error('Reference UI: NumberField "value" must be a finite number or null.')
    }
    if (defaultValue !== null && !Number.isFinite(defaultValue)) {
      throw new Error('Reference UI: NumberField "defaultValue" must be a finite number or null.')
    }
    if (Number.isNaN(min)) {
      throw new Error('Reference UI: NumberField "min" must be a number.')
    }
    if (Number.isNaN(max)) {
      throw new Error('Reference UI: NumberField "max" must be a number.')
    }
    if (min > max) {
      throw new Error('Reference UI: NumberField "min" must be less than or equal to "max".')
    }
    if (!Number.isFinite(step) || step <= 0) {
      throw new Error('Reference UI: NumberField "step" must be a finite number greater than 0.')
    }

    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<number | null>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    const inputRef = React.useRef<HTMLInputElement | null>(null)

    const focusInput = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = inputRef.current.value.length
        try {
          inputRef.current.setSelectionRange(len, len)
        } catch {
          // ignore if not supported
        }
      }
    }, [])

    const increment = React.useCallback(
      (factor = 1) => {
        if (disabled) return
        const current = value ?? 0
        const nextVal = Math.min(max, cleanFloat(current + step * factor))
        if (!isControlled) {
          setInternalValue(nextVal)
        }
        onChange?.(nextVal)
      },
      [value, max, step, disabled, isControlled, onChange]
    )

    const decrement = React.useCallback(
      (factor = 1) => {
        if (disabled) return
        const current = value ?? 0
        const nextVal = Math.max(min, cleanFloat(current - step * factor))
        if (!isControlled) {
          setInternalValue(nextVal)
        }
        onChange?.(nextVal)
      },
      [value, min, step, disabled, isControlled, onChange]
    )

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value
        if (valStr.trim() === '') {
          if (!isControlled) setInternalValue(null)
          onChange?.(null)
          return
        }
        const num = Number(valStr)
        if (!Number.isNaN(num)) {
          const clamped = Math.max(min, Math.min(max, num))
          if (!isControlled) setInternalValue(clamped)
          onChange?.(clamped)
        }
      },
      [min, max, isControlled, onChange]
    )

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        const factor = e.shiftKey ? 10 : 1

        if (e.key === 'ArrowUp') {
          // Alt/Ctrl/Meta-modified arrows stay native (NF-KEY-03).
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          increment(factor)
        } else if (e.key === 'ArrowDown') {
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          decrement(factor)
        } else if (e.key === 'Home') {
          // Home/End target supplied bounds only when unmodified (NF-KEY-04).
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (min === -Infinity) return
          e.preventDefault()
          if (!isControlled) setInternalValue(min)
          onChange?.(min)
        } else if (e.key === 'End') {
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (max === Infinity) return
          e.preventDefault()
          if (!isControlled) setInternalValue(max)
          onChange?.(max)
        }
      },
      [disabled, increment, decrement, min, max, isControlled, onChange]
    )

    const contextValue = React.useMemo<NumberFieldContextValue>(
      () => ({
        value,
        min,
        max,
        step,
        disabled,
        increment,
        decrement,
        handleInputChange,
        handleKeyDown,
        inputRef,
        focusInput,
      }),
      [value, min, max, step, disabled, increment, decrement, handleInputChange, handleKeyDown, focusInput]
    )

    return (
      <NumberFieldContext.Provider value={contextValue}>
        {/* Consumer props spread first: managed role/data authority
            defeats conflicting casts (NF-DOM-06); unrelated props and
            StyleProps pass through (NF-DOM-05). */}
        <Div
          ref={ref}
          {...props}
          role="group"
          data-reference-field=""
          data-reference-number-field=""
          data-disabled={disabled ? '' : undefined}
          className={className}
          style={style}
        >
          {children ?? (
            <>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </>
          )}
        </Div>
      </NumberFieldContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<NumberFieldProps & React.RefAttributes<HTMLDivElement>> & {
  Input: typeof NumberFieldInput
  Increment: typeof NumberFieldIncrement
  Decrement: typeof NumberFieldDecrement
}

NumberField.Input = NumberFieldInput
NumberField.Increment = NumberFieldIncrement
NumberField.Decrement = NumberFieldDecrement
