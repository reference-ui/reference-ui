import * as React from 'react'
import { Input, Button, Span, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'
import { Field } from '../Field'
import { CalendarTodayIcon } from '@reference-ui/icons'

export type DateFieldProps = Omit<PrimitiveProps<'input'>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: ISODate | null
  defaultValue?: ISODate | null
  onChange?: (value: ISODate | null) => void
  locale?: string
  min?: ISODate
  max?: ISODate
  disabled?: boolean
  name?: string
  form?: string
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
  onKeyDown,
  ...props
}: DateFieldInputProps) {
  const context = React.useContext(DateFieldContext)
  if (!context) return null

  const { value, isOpen, setIsOpen, disabled, handleInputChange } = context

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return

    if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
      e.preventDefault()
      setIsOpen(true)
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
    }
  }

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
      onKeyDown={handleKeyDown}
      data-reference-date-input=""
      className={className}
      style={style}
      {...props}
    />
  )
}
DateFieldInput.displayName = 'DateFieldInput'
;(DateFieldInput as any).__refPart = 'DateFieldInput'

export type DateFieldTriggerProps = React.ComponentPropsWithoutRef<typeof Overlay.Trigger>

export function DateFieldTrigger({
  children,
  className,
  style,
  ...props
}: DateFieldTriggerProps) {
  return (
    <Overlay.Trigger
      aria-haspopup="dialog"
      type="button"
      tabIndex={-1}
      bg="transparent"
      border="none"
      p="0"
      width="6r"
      height="6r"
      minWidth="6r"
      marginInlineEnd="-2r"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      color="design.text.base"
      _hover={{ bg: 'gray.800', color: 'ui.field.foreground' }}
      borderRadius="sm"
      data-reference-date-trigger=""
      className={className}
      style={style}
      {...props}
    >
      {children ?? <CalendarTodayIcon />}
    </Overlay.Trigger>
  )
}
DateFieldTrigger.displayName = 'DateFieldTrigger'
;(DateFieldTrigger as any).__refPart = 'DateFieldTrigger'

export type DateFieldPickerProps = OverlayContentProps

export function DateFieldPicker({
  children,
  placement = 'bottom-start',
  className,
  style,
  ...props
}: DateFieldPickerProps) {
  const context = React.useContext(DateFieldContext)

  return (
    <Overlay.Content
      role="dialog"
      placement={placement}
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      boxShadow="0 4px 16px rgba(0,0,0,0.15)"
      border="1px solid"
      borderColor="ui.dialog.border"
      p="2r"
      data-reference-date-picker=""
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
DateFieldPicker.displayName = 'DateFieldPicker'
;(DateFieldPicker as any).__refPart = 'DateFieldPicker'

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
DateFieldCalendar.displayName = 'DateFieldCalendar'
;(DateFieldCalendar as any).__refPart = 'DateFieldCalendar'

function isFieldElement(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) return false
  return (
    child.type === Field ||
    (child.type as any)?.displayName === 'Field' ||
    Boolean((child.props as any)?.['data-reference-field'])
  )
}

function isInputPart(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) return false
  return (
    child.type === DateFieldInput ||
    child.type === DateField.Input ||
    (child.type as any)?.displayName === 'DateFieldInput' ||
    (child.type as any)?.displayName === 'DateField.Input' ||
    (child.type as any)?.__refPart === 'DateFieldInput' ||
    Boolean((child.props as any)?.['data-reference-date-input']) ||
    (child.props as any)?.role === 'combobox' ||
    child.type === 'input' ||
    child.type === Input
  )
}

function isTriggerPart(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) return false
  return (
    child.type === DateFieldTrigger ||
    child.type === DateField.Trigger ||
    (child.type as any)?.displayName === 'DateFieldTrigger' ||
    (child.type as any)?.displayName === 'DateField.Trigger' ||
    (child.type as any)?.__refPart === 'DateFieldTrigger' ||
    Boolean((child.props as any)?.['data-reference-date-trigger'])
  )
}

function isPickerPart(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) return false
  return (
    child.type === DateFieldPicker ||
    child.type === DateField.Picker ||
    (child.type as any)?.displayName === 'DateFieldPicker' ||
    (child.type as any)?.displayName === 'DateField.Picker' ||
    (child.type as any)?.__refPart === 'DateFieldPicker' ||
    Boolean((child.props as any)?.['data-reference-date-picker'])
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
      name,
      form,
      placeholder,
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
        <>
          <Input
            ref={ref}
            type="text"
            disabled={disabled}
            value={value ?? ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={className}
            style={style}
            {...props}
          />
          {name && !disabled && (
            <input type="hidden" name={name} value={value ?? ''} form={form} />
          )}
        </>
      )
    }

    const fieldRef = React.useRef<HTMLDivElement | null>(null)
    const composedFieldRef = (node: HTMLDivElement | null) => {
      fieldRef.current = node
      if (typeof ref === 'function') {
        ref(node as any)
      } else if (ref && typeof ref === 'object') {
        ;(ref as any).current = node
      }
    }

    const childArray = React.Children.toArray(children)
    const hasField = childArray.some(isFieldElement)

    if (hasField) {
      return (
        <DateFieldContext.Provider value={contextValue}>
          <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
            {children}
            {name && !disabled && (
              <input type="hidden" name={name} value={value ?? ''} form={form} />
            )}
          </Overlay>
        </DateFieldContext.Provider>
      )
    }

    const inputChildren: React.ReactNode[] = []
    const triggerChildren: React.ReactNode[] = []
    const pickerChildren: React.ReactNode[] = []
    const otherChildren: React.ReactNode[] = []

    for (const child of childArray) {
      if (isInputPart(child)) {
        inputChildren.push(child)
      } else if (isTriggerPart(child)) {
        triggerChildren.push(child)
      } else if (isPickerPart(child)) {
        pickerChildren.push(child)
      } else {
        otherChildren.push(child)
      }
    }

    const hasAuthoredInput = inputChildren.length > 0
    const hasAuthoredTrigger = triggerChildren.length > 0
    const hasAuthoredPicker = pickerChildren.length > 0

    return (
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
          >
            {hasAuthoredInput ? inputChildren : <DateFieldInput placeholder={placeholder} />}
            {hasAuthoredTrigger ? (
              triggerChildren
            ) : hasAuthoredPicker && !hasAuthoredInput ? (
              <DateFieldTrigger />
            ) : null}
            {otherChildren}
          </Div>
          {pickerChildren}
          {name && !disabled && (
            <input type="hidden" name={name} value={value ?? ''} form={form} />
          )}
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

