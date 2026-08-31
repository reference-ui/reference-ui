import * as React from 'react'
import { Overlay } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'

export interface DateFieldProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange' | 'value' | 'defaultValue'> {
  value?: ISODate | null
  defaultValue?: ISODate | null
  onChange?: (value: ISODate | null) => void
  locale?: string
  min?: ISODate
  max?: ISODate
  disabled?: boolean
}

interface DateFieldContextValue {
  value: ISODate | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  locale: string
  disabled: boolean
  handleDateSelect: (date: ISODate | null) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const DateFieldContext = React.createContext<DateFieldContextValue | null>(null)

export function DateFieldInput({
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'input'>) {
  const context = React.useContext(DateFieldContext)
  if (!context) return null

  const { value, isOpen, setIsOpen, disabled, handleInputChange } = context

  return (
    <input
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-autocomplete="none"
      disabled={disabled}
      value={value ?? ''}
      onChange={handleInputChange}
      onClick={() => setIsOpen(true)}
      className={className}
      style={{
        padding: '6px 10px',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid #ccc',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  )
}

export function DateFieldTrigger({
  children = '📅',
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Overlay.Trigger aria-haspopup="dialog" {...props}>
      <span style={{ fontSize: 16 }}>{children}</span>
    </Overlay.Trigger>
  )
}

export function DateFieldPicker({
  children,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const context = React.useContext(DateFieldContext)

  return (
    <Overlay.Portal>
      <Overlay.Content
        role="dialog"
        className={className}
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          padding: 8,
          zIndex: 50,
          ...style,
        }}
        {...props}
      >
        {children ?? (
          <Calendar
            value={context?.value}
            locale={context?.locale}
            onChange={(nextVal) => context?.handleDateSelect(nextVal)}
          />
        )}
      </Overlay.Content>
    </Overlay.Portal>
  )
}

export function DateFieldCalendar(props: React.ComponentPropsWithoutRef<typeof Calendar>) {
  const context = React.useContext(DateFieldContext)
  return (
    <Calendar
      value={context?.value}
      locale={context?.locale}
      onChange={(nextVal) => context?.handleDateSelect(nextVal)}
      {...props}
    />
  )
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(
    {
      children,
      value: valueProp,
      defaultValue = null,
      onChange,
      locale = 'en-US',
      min,
      max,
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<ISODate | null>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    const [isOpen, setIsOpen] = React.useState(false)

    const handleDateSelect = React.useCallback(
      (nextDate: ISODate | null) => {
        if (!isControlled) {
          setInternalValue(nextDate)
        }
        onChange?.(nextDate)
        setIsOpen(false)
      },
      [isControlled, onChange]
    )

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        if (!isControlled) {
          setInternalValue(val)
        }
        onChange?.(val)
      },
      [isControlled, onChange]
    )

    const contextValue = React.useMemo<DateFieldContextValue>(
      () => ({
        value,
        isOpen,
        setIsOpen,
        locale,
        disabled,
        handleDateSelect,
        handleInputChange,
      }),
      [value, isOpen, setIsOpen, locale, disabled, handleDateSelect, handleInputChange]
    )

    if (!children) {
      return (
        <input
          ref={ref}
          type="text"
          disabled={disabled}
          value={value ?? ''}
          onChange={handleInputChange}
          className={className}
          style={{
            padding: '6px 10px',
            fontSize: 14,
            borderRadius: 6,
            border: '1px solid #ccc',
            outline: 'none',
            ...style,
          }}
          {...props}
        />
      )
    }

    return (
      <DateFieldContext.Provider value={contextValue}>
        <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
          <div
            data-reference-field=""
            className={className}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              ...style,
            }}
          >
            {children}
          </div>
        </Overlay>
      </DateFieldContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<DateFieldProps & React.RefAttributes<HTMLInputElement>> & {
  Input: typeof DateFieldInput
  Trigger: typeof DateFieldTrigger
  Picker: typeof DateFieldPicker
  Calendar: typeof DateFieldCalendar
}

DateField.Input = DateFieldInput
DateField.Trigger = DateFieldTrigger
DateField.Picker = DateFieldPicker
DateField.Calendar = DateFieldCalendar
