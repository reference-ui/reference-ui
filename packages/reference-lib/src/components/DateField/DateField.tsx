import * as React from 'react'
import { Input, Button, Span, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'
import { isValidISODate, type ISODate as CanonicalISODate } from '../Calendar/iso'
import { CalendarTodayIcon } from '@reference-ui/icons'
import { createSlotRootContext } from '../Slot'
import { assertValidDateBounds, isDateWithinConstraints } from './parse'

export type DateFieldProps = Omit<PrimitiveProps<'input'>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: ISODate | null
  defaultValue?: ISODate | null
  onChange?: (value: ISODate | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  name?: string
  form?: string
}

const {
  Provider: DateFieldSlotProvider,
  useSlotRegistration,
  useSlot,
} = createSlotRootContext<{ ref?: React.Ref<any> }>()

interface DateFieldContextValue {
  value: ISODate | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  locale: string
  min?: ISODate
  max?: ISODate
  constraintInvalid: boolean
  disabled: boolean
  required: boolean
  pickerId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  handleDateSelect: (date: ISODate | null) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleInputClick: () => void
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
  }
}

const DateFieldContext = React.createContext<DateFieldContextValue | null>(null)

function mergeClassNames(...classes: Array<string | undefined | null | false>): string | undefined {
  const merged = classes.filter(Boolean).join(' ')
  return merged ? merged : undefined
}

function mergeStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties | undefined {
  const merged: React.CSSProperties = {}
  for (const s of styles) {
    if (s) Object.assign(merged, s)
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

export type DateFieldInputProps = PrimitiveProps<'input'>

export const DateFieldInput = React.forwardRef<HTMLInputElement, DateFieldInputProps>(
  function DateFieldInput(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'input',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldInput.displayName = 'DateFieldInput'

export type DateFieldTriggerProps = React.ComponentPropsWithoutRef<typeof Overlay.Trigger>

export const DateFieldTrigger = React.forwardRef<HTMLButtonElement, DateFieldTriggerProps>(
  function DateFieldTrigger(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'trigger',
      element: <button {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldTrigger.displayName = 'DateFieldTrigger'

export type DateFieldPickerProps = OverlayContentProps

export const DateFieldPicker = React.forwardRef<HTMLDivElement, DateFieldPickerProps>(
  function DateFieldPicker(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'picker',
      element: <div {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldPicker.displayName = 'DateFieldPicker'

export function DateFieldCalendar(props: React.ComponentPropsWithoutRef<typeof Calendar>) {
  const context = React.useContext(DateFieldContext)
  // isDateUnavailable stays DateField-side: Calendar has no such prop yet (Calendar #6),
  // so passing it would leak a function onto the grid DOM node.
  return (
    <Calendar
      value={context?.value}
      locale={context?.locale}
      min={context?.min}
      max={context?.max}
      onChange={(nextVal) => context?.handleDateSelect(nextVal)}
      {...props}
    />
  )
}
DateFieldCalendar.displayName = 'DateFieldCalendar'

function DateFieldLayout() {
  const context = React.useContext(DateFieldContext)
  const inputSlot = useSlot('input')
  const triggerSlot = useSlot('trigger')
  const pickerSlot = useSlot('picker')
  if (!context) return null

  const isPickerPresent = Boolean(pickerSlot)

  const {
    value,
    isOpen,
    constraintInvalid,
    disabled,
    required,
    pickerId,
    inputRef,
    handleInputChange,
    handleInputKeyDown,
    handleInputClick,
    rootInputProps,
  } = context

  // Part-Resolution Law for the input:
  // merge(inputDefaults, rootInputProps, explicitInputProps, managedMachineProps).
  const explicitProps = (inputSlot?.element.props as Record<string, any> | undefined) ?? {}
  const explicitRef = inputSlot?.meta?.ref as React.Ref<HTMLInputElement> | undefined

  const composedInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof explicitRef === 'function') {
      explicitRef(node)
    } else if (explicitRef && typeof explicitRef === 'object') {
      ;(explicitRef as React.RefObject<HTMLInputElement | null>).current = node
    }
  }

  const inputId = explicitProps.id ?? rootInputProps.id
  const placeholder = explicitProps.placeholder ?? rootInputProps.placeholder
  const className = mergeClassNames(rootInputProps.className, explicitProps.className)
  const style = mergeStyles(rootInputProps.style, explicitProps.style)
  const isDisabled = explicitProps.disabled ?? disabled
  const isReadOnly = explicitProps.readOnly ?? rootInputProps.readOnly
  const isRequired = explicitProps.required ?? required

  const onInputComposed = (e: React.FormEvent<HTMLInputElement>) => {
    explicitProps.onInput?.(e)
    rootInputProps.onInput?.(e)
  }

  const onChangeComposed = (e: React.ChangeEvent<HTMLInputElement>) => {
    explicitProps.onChange?.(e)
    handleInputChange(e)
  }

  const onKeyDownComposed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    explicitProps.onKeyDown?.(e)
    rootInputProps.onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleInputKeyDown(e)
    }
  }

  const onFocusComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onFocus?.(e)
    rootInputProps.onFocus?.(e)
  }

  const onBlurComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onBlur?.(e)
    rootInputProps.onBlur?.(e)
  }

  const onClickComposed = (e: React.MouseEvent<HTMLInputElement>) => {
    explicitProps.onClick?.(e)
    rootInputProps.onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleInputClick()
    }
  }

  const explicitAriaInvalid = explicitProps['aria-invalid']
  // Managed constraint-invalid always wins (aria-invalid is a managed prop);
  // otherwise the authored value passes through untouched.
  const ariaInvalid = constraintInvalid ? true : explicitAriaInvalid

  const {
    className: _explicitClassName,
    style: _explicitStyle,
    placeholder: _explicitPlaceholder,
    id: _explicitId,
    'aria-invalid': _explicitAriaInvalid,
    onInput: _explicitOnInput,
    onChange: _explicitOnChange,
    onKeyDown: _explicitOnKeyDown,
    onFocus: _explicitOnFocus,
    onBlur: _explicitOnBlur,
    onClick: _explicitOnClick,
    value: _explicitValue,
    defaultValue: _explicitDefaultValue,
    disabled: _explicitDisabled,
    readOnly: _explicitReadOnly,
    required: _explicitRequired,
    autoComplete: _explicitAutoComplete,
    autoCorrect: _explicitAutoCorrect,
    spellCheck: _explicitSpellCheck,
    inputMode: _explicitInputMode,
    role: _explicitRole,
    type: _explicitType,
    children: _explicitChildren,
    ...restExplicitProps
  } = explicitProps

  const inputNode = (
    <Input
      {...restExplicitProps}
      ref={composedInputRef}
      id={inputId}
      type="text"
      role={isPickerPresent ? 'combobox' : undefined}
      aria-haspopup={isPickerPresent ? 'dialog' : undefined}
      aria-expanded={isPickerPresent ? isOpen : undefined}
      aria-controls={isPickerPresent ? pickerId : undefined}
      aria-autocomplete={isPickerPresent ? 'none' : undefined}
      aria-invalid={ariaInvalid}
      data-invalid={constraintInvalid ? 'true' : undefined}
      data-reference-date-input=""
      inputMode="text"
      autoComplete={explicitProps.autoComplete ?? rootInputProps.autoComplete ?? 'off'}
      autoCorrect={explicitProps.autoCorrect ?? rootInputProps.autoCorrect ?? 'off'}
      spellCheck={explicitProps.spellCheck ?? rootInputProps.spellCheck ?? false}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      placeholder={placeholder}
      value={value ?? ''}
      onInput={onInputComposed}
      onChange={onChangeComposed}
      onKeyDown={onKeyDownComposed}
      onFocus={onFocusComposed}
      onBlur={onBlurComposed}
      onClick={onClickComposed}
      className={className}
      style={style}
    />
  )

  // Trigger: explicit part unfolds the synthesized default. Clicking toggles
  // (via Overlay.Trigger) while focus stays on (or returns to) the input.
  let triggerNode: React.ReactNode = null
  if (triggerSlot || isPickerPresent) {
    const trigProps = (triggerSlot?.element.props as Record<string, any> | undefined) ?? {}
    const trigRef = triggerSlot?.meta?.ref as React.Ref<HTMLButtonElement> | undefined
    const isTriggerDisabled = trigProps.disabled ?? disabled

    const onTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      trigProps.onClick?.(e)
      if (!e.defaultPrevented && !isTriggerDisabled) {
        inputRef.current?.focus()
      }
    }

    const {
      onClick: _trigOnClick,
      disabled: _trigDisabled,
      tabIndex: _trigTabIndex,
      children: _trigChildren,
      ...restTrigProps
    } = trigProps

    triggerNode = (
      <Overlay.Trigger
        aria-haspopup="dialog"
        type="button"
        tabIndex={trigProps.tabIndex ?? -1}
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
        {...(restTrigProps as any)}
        ref={(node: HTMLButtonElement | null) => {
          if (typeof trigRef === 'function') {
            trigRef(node)
          } else if (trigRef && typeof trigRef === 'object') {
            ;(trigRef as React.RefObject<HTMLButtonElement | null>).current = node
          }
        }}
        disabled={isTriggerDisabled}
        data-reference-date-trigger=""
        onClick={onTriggerClick}
      >
        {trigProps.children ?? <CalendarTodayIcon />}
      </Overlay.Trigger>
    )
  }

  return (
    <>
      {inputNode}
      {triggerNode}
    </>
  )
}

function DateFieldPickerLayer() {
  const context = React.useContext(DateFieldContext)
  const pickerSlot = useSlot('picker')
  if (!context || !pickerSlot) return null

  const { value, locale, min, max, pickerId, handleDateSelect } = context

  const pickerProps = (pickerSlot.element.props as Record<string, any> | undefined) ?? {}
  const pickerRef = pickerSlot.meta?.ref as React.Ref<HTMLDivElement> | undefined
  const placement = pickerProps.placement ?? 'bottom-start'

  const {
    id: _pickerId,
    role: _pickerRole,
    placement: _pickerPlacement,
    children: _pickerChildren,
    ...restPickerProps
  } = pickerProps

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
      {...(restPickerProps as any)}
      id={pickerId}
      data-reference-date-picker=""
      ref={(node: HTMLDivElement | null) => {
        if (typeof pickerRef === 'function') {
          pickerRef(node)
        } else if (pickerRef && typeof pickerRef === 'object') {
          ;(pickerRef as React.RefObject<HTMLDivElement | null>).current = node
        }
      }}
    >
      {pickerProps.children ?? (
        <Calendar
          value={value}
          locale={locale}
          min={min}
          max={max}
          onChange={(nextVal) => handleDateSelect(nextVal)}
        />
      )}
    </Overlay.Content>
  )
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(
    {
      children,
      value: valueProp,
      defaultValue = null,
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
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<ISODate | null>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    // Programmatic constraint-invalid: a canonical value outside min/max or
    // marked unavailable still displays; dirty text is never invalid here.
    const constraintInvalid =
      value != null &&
      isValidISODate(value) &&
      // Bounds already passed assertValidDateBounds above; the casts bridge
      // Calendar's string-typed ISODate to the canonical template type.
      !isDateWithinConstraints(
        value,
        min as CanonicalISODate,
        max as CanonicalISODate,
        isDateUnavailable
      )

    const [isOpen, setIsOpen] = React.useState(false)

    const reactId = React.useId()
    const [pickerId] = React.useState(() => `datefield-picker-${reactId.replace(/:/g, '')}`)

    const fieldRef = React.useRef<HTMLDivElement | null>(null)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    const handleDateSelect = React.useCallback(
      (nextDate: ISODate | null) => {
        // Never publish a violating date: reject without commit or dismiss,
        // never clamp. Clearing (null) is always allowed.
        if (
          nextDate !== null &&
          !isDateWithinConstraints(
            nextDate as CanonicalISODate,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          return
        }
        if (!isControlled) {
          setInternalValue(nextDate)
        }
        onChange?.(nextDate)
        setIsOpen(false)
      },
      [isControlled, onChange, min, max, isDateUnavailable]
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

    const handleInputKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.defaultPrevented || disabled) return

        if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
          e.preventDefault()
          setIsOpen(true)
        } else if (e.key === 'Escape' && isOpen) {
          e.preventDefault()
          setIsOpen(false)
        }
      },
      [disabled, isOpen]
    )

    const handleInputClick = React.useCallback(() => {
      if (disabled) return
      setIsOpen(true)
    }, [disabled])

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
        disabled,
        required,
        pickerId,
        inputRef,
        handleDateSelect,
        handleInputChange,
        handleInputKeyDown,
        handleInputClick,
        rootInputProps,
      }),
      [
        value,
        isOpen,
        locale,
        min,
        max,
        constraintInvalid,
        disabled,
        required,
        pickerId,
        inputRef,
        handleDateSelect,
        handleInputChange,
        handleInputKeyDown,
        handleInputClick,
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
      const childlessAriaInvalid = (props as Record<string, any>)['aria-invalid']
      return (
        <>
          <Input
            ref={composedChildlessRef}
            type="text"
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            value={value ?? ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={className}
            style={style}
            {...props}
            aria-invalid={constraintInvalid ? true : childlessAriaInvalid}
            data-invalid={constraintInvalid ? 'true' : undefined}
          />
          {name && !disabled && (
            <input type="hidden" name={name} value={value ?? ''} form={form} />
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
              <input type="hidden" name={name} value={value ?? ''} form={form} />
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
}

DateField.Input = DateFieldInput
DateField.Trigger = DateFieldTrigger
DateField.Picker = DateFieldPicker
DateField.Calendar = DateFieldCalendar
