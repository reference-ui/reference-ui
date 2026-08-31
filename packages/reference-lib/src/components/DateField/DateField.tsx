import * as React from 'react'
import { Input, Button, Span, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'

export type DateFieldProps = Omit<PrimitiveProps<'input'>, 'onChange' | 'value' | 'defaultValue'> & {
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

export type DateFieldInputProps = PrimitiveProps<'input'>

export function DateFieldInput({
  className,
  style,
  ...props
}: DateFieldInputProps) {
  const context = React.useContext(DateFieldContext)
  if (!context) return null

  const { value, isOpen, setIsOpen, disabled, handleInputChange } = context

  return (
    <Input
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
      style={style}
      {...props}
    />
  )
}

export type DateFieldTriggerProps = React.ComponentPropsWithoutRef<typeof Overlay.Trigger>

export function DateFieldTrigger({
  children = '📅',
  className,
  style,
  ...props
}: DateFieldTriggerProps) {
  return (
    <Overlay.Trigger aria-haspopup="dialog" {...props}>
      <Span fontSize="4r">{children}</Span>
    </Overlay.Trigger>
  )
}

export type DateFieldPickerProps = OverlayContentProps

export function DateFieldPicker({
  children,
  className,
  style,
  ...props
}: DateFieldPickerProps) {
  const context = React.useContext(DateFieldContext)

  return (
    <Overlay.Content
      role="dialog"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      boxShadow="0 4px 16px rgba(0,0,0,0.15)"
      border="1px solid"
      borderColor="ui.dialog.border"
      p="2r"
      zIndex={50}
      className={className}
      style={style}
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
        <Input
          ref={ref}
          type="text"
          disabled={disabled}
          value={value ?? ''}
          onChange={handleInputChange}
          className={className}
          style={style}
          {...props}
        />
      )
    }

    return (
      <DateFieldContext.Provider value={contextValue}>
        <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
          <Div
            data-reference-field=""
            display="inline-flex"
            alignItems="center"
            gap="1r"
            className={className}
            style={style}
          >
            {children}
          </Div>
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
