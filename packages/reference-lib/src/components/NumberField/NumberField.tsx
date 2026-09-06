import * as React from 'react'
import { Div, Input, Button, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { controlSize, controlHeightPx } from '../../core/theme/primitives/shared'

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
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null)

export type NumberFieldInputProps = PrimitiveProps<'input'>

export function NumberFieldInput({
  className,
  style,
  onKeyDown: userOnKeyDown,
  ...props
}: NumberFieldInputProps) {
  const context = React.useContext(NumberFieldContext)
  if (!context) return null

  const { value, min, max, disabled, handleInputChange, handleKeyDown } = context

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    userOnKeyDown?.(e)
    if (!e.defaultPrevented) {
      handleKeyDown(e)
    }
  }

  return (
    <Input
      type="text"
      role="spinbutton"
      inputMode="decimal"
      aria-valuenow={value !== null ? value : undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      disabled={disabled}
      value={value !== null ? String(value) : ''}
      onChange={handleInputChange}
      onKeyDown={onKeyDown}
      flex="1"
      minWidth="8r"
      height="100%"
      textAlign="center"
      bg="transparent"
      border="none"
      outline="none"
      p="0"
      color="design.text.base"
      className={className}
      style={style}
      {...props}
    />
  )
}

export type NumberFieldIncrementProps = PrimitiveProps<'button'>

export function NumberFieldIncrement({
  children,
  className,
  style,
  onClick,
  ...props
}: NumberFieldIncrementProps) {
  const context = React.useContext(NumberFieldContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.increment()
    }
  }

  return (
    <Button
      type="button"
      tabIndex={-1}
      aria-label="Increment"
      disabled={context?.disabled}
      onClick={handleClick}
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
      cursor={context?.disabled ? 'not-allowed' : 'pointer'}
      opacity={context?.disabled ? 0.5 : 1}
      outline="none"
      _hover={!context?.disabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
      _active={!context?.disabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
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

export type NumberFieldDecrementProps = PrimitiveProps<'button'>

export function NumberFieldDecrement({
  children,
  className,
  style,
  onClick,
  ...props
}: NumberFieldDecrementProps) {
  const context = React.useContext(NumberFieldContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.decrement()
    }
  }

  return (
    <Button
      type="button"
      tabIndex={-1}
      aria-label="Decrement"
      disabled={context?.disabled}
      onClick={handleClick}
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
      cursor={context?.disabled ? 'not-allowed' : 'pointer'}
      opacity={context?.disabled ? 0.5 : 1}
      outline="none"
      _hover={!context?.disabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
      _active={!context?.disabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
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
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<number | null>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    const increment = React.useCallback(
      (factor = 1) => {
        if (disabled) return
        const current = value ?? 0
        const nextVal = Math.min(max, current + step * factor)
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
        const nextVal = Math.max(min, current - step * factor)
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
          e.preventDefault()
          increment(factor)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          decrement(factor)
        } else if (e.key === 'Home' && min !== -Infinity) {
          e.preventDefault()
          if (!isControlled) setInternalValue(min)
          onChange?.(min)
        } else if (e.key === 'End' && max !== Infinity) {
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
      }),
      [value, min, max, step, disabled, increment, decrement, handleInputChange, handleKeyDown]
    )

    return (
      <NumberFieldContext.Provider value={contextValue}>
        <Div
          ref={ref}
          role="group"
          data-reference-field=""
          data-reference-number-field=""
          data-disabled={disabled ? '' : undefined}
          display="inline-flex"
          alignItems="center"
          width="fit-content"
          maxW="36r"
          height={controlSize.height}
          minHeight={controlSize.height}
          p="0.75r"
          gap="0.5r"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="md"
          bg="ui.field.background"
          boxSizing="border-box"
          _focusWithin={{ borderColor: 'ui.focus.ring' }}
          className={className}
          style={{
            minHeight: controlHeightPx,
            height: controlHeightPx,
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
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
