import * as React from 'react'
import { Input, Button, Span, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'
import { isValidISODate, type ISODate as CanonicalISODate } from '../Calendar/iso'
import { CalendarTodayIcon } from '@reference-ui/icons'
import { createSlotRootContext } from '../Slot'
import {
  assertValidDateBounds,
  formatLocalDate,
  isDateWithinConstraints,
  parseLocalDate,
} from './parse'

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
  // Context isDateUnavailable stays DateField-side until DateField
  // PATCHES #4 wires the bound alias; a caller-provided predicate spreads
  // through `rest` onto the Calendar #6 prop and works today.
  // Single-spread object: Calendar props are a mode-keyed union, so
  // caller `value`/`onChange`/`locale` merge explicitly and everything
  // else spreads through. Caller props still override context, as before.
  const { value: callerValue, onChange: callerOnChange, locale: callerLocale, ...rest } = props
  const calendarProps = {
    value: callerValue ?? context?.value ?? null,
    locale: callerLocale ?? context?.locale,
    min: context?.min,
    max: context?.max,
    onChange: callerOnChange ?? ((nextVal: ISODate) => context?.handleDateSelect(nextVal)),
    ...rest,
  } as React.ComponentPropsWithoutRef<typeof Calendar>
  return <Calendar {...calendarProps} />
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
    locale,
    isOpen,
    constraintInvalid,
    failedBoundary,
    disabled,
    required,
    pickerId,
    inputRef,
    buffer,
    isDirty,
    handleInput,
    handleKeyDown,
    handleBlur,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    rootInputProps,
  } = context

  // Engine display (PATCHES #1): the dirty buffer while editing, else the
  // locale-formatted controlled value. A non-canonical programmatic value
  // is author error outside the engine's gate — it passes through verbatim
  // exactly as before, never crashing the formatter.
  const displayText = isDirty
    ? buffer
    : value == null
      ? ''
      : isValidISODate(value)
        ? formatLocalDate(value, locale)
        : value
  const isInvalid = constraintInvalid || failedBoundary
  const isEmpty = isDirty ? buffer === '' : value === null

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
    handleInput(e)
  }

  const onKeyDownComposed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    explicitProps.onKeyDown?.(e)
    rootInputProps.onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleKeyDown(e)
    }
  }

  const onFocusComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onFocus?.(e)
    rootInputProps.onFocus?.(e)
  }

  const onBlurComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onBlur?.(e)
    rootInputProps.onBlur?.(e)
    // Authored blur handlers run first: preventDefault() cancels the commit
    // boundary and the dirty buffer stays intact while unfocused (DF-CMT-03).
    if (!e.defaultPrevented && !isDisabled) {
      handleBlur(e)
    }
  }

  const onClickComposed = (e: React.MouseEvent<HTMLInputElement>) => {
    explicitProps.onClick?.(e)
    rootInputProps.onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleClick()
    }
  }

  const onCompositionStartComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionStart?.(e)
    rootInputProps.onCompositionStart?.(e)
    handleCompositionStart()
  }

  const onCompositionEndComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionEnd?.(e)
    rootInputProps.onCompositionEnd?.(e)
    handleCompositionEnd()
  }

  const explicitAriaInvalid = explicitProps['aria-invalid']
  // Managed invalid (programmatic constraint failure or a failed commit
  // boundary) always wins (aria-invalid is a managed prop); otherwise the
  // authored value passes through untouched.
  const ariaInvalid = isInvalid ? true : explicitAriaInvalid

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
    onCompositionStart: _explicitOnCompositionStart,
    onCompositionEnd: _explicitOnCompositionEnd,
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
      data-invalid={isInvalid ? 'true' : undefined}
      data-editing={isDirty ? 'true' : undefined}
      data-empty={isEmpty ? 'true' : undefined}
      data-reference-date-input=""
      inputMode="text"
      autoComplete={explicitProps.autoComplete ?? rootInputProps.autoComplete ?? 'off'}
      autoCorrect={explicitProps.autoCorrect ?? rootInputProps.autoCorrect ?? 'off'}
      spellCheck={explicitProps.spellCheck ?? rootInputProps.spellCheck ?? false}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      placeholder={placeholder}
      value={displayText}
      onInput={onInputComposed}
      onChange={onChangeComposed}
      onKeyDown={onKeyDownComposed}
      onFocus={onFocusComposed}
      onBlur={onBlurComposed}
      onClick={onClickComposed}
      onCompositionStart={onCompositionStartComposed}
      onCompositionEnd={onCompositionEndComposed}
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

    // Dirty edit session (PATCHES #1): the transient text buffer plus its
    // flag. A user edit starts the session even when the resulting string
    // equals formatted controlled text — data-editing reflects the flag,
    // not string inequality.
    const [buffer, setBuffer] = React.useState<string>(() =>
      value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
    )
    const [isDirty, setIsDirty] = React.useState(false)
    const [hasFailedBoundary, setHasFailedBoundary] = React.useState(false)
    const isComposingRef = React.useRef(false)

    const reactId = React.useId()
    const [pickerId] = React.useState(() => `datefield-picker-${reactId.replace(/:/g, '')}`)

    const fieldRef = React.useRef<HTMLDivElement | null>(null)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    // Live value / locale synchronization (DF-CMT-04/05/06): a programmatic
    // change replaces the buffer from latest controlled state — except an
    // accepted live echo (dirty buffer parses to the new value), which
    // preserves the buffer. A change during composition invalidates that
    // session, so a stale compositionend is ignored (DF-CMT-07). Reads the
    // render's buffer/isDirty: the effect runs only on value/locale edges.
    React.useEffect(() => {
      if (isComposingRef.current) {
        isComposingRef.current = false
      }
      if (isDirty) {
        const parsed = parseLocalDate(buffer, locale)
        if (parsed.valid && parsed.iso === value) {
          return
        }
      }
      setBuffer(
        value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
      )
      setIsDirty(false)
      setHasFailedBoundary(false)
    }, [value, locale])

    // Commit boundary (blur / Enter): a complete in-constraints candidate
    // requests once when it differs from the prop and reformats; empty
    // requests null once; incomplete, impossible, or out-of-constraints
    // text reverts to formatted controlled state and fails the boundary,
    // which surfaces managed invalid until the next resolution. Never
    // clamps, never publishes garbage (B-15), never publishes past
    // min/max/unavailable (B-16).
    const commit = React.useCallback(() => {
      if (isComposingRef.current) return
      if (!isDirty) return

      const res = parseLocalDate(buffer, locale)
      if (res.valid && res.iso) {
        if (
          isDateWithinConstraints(
            res.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          if (res.iso !== value) {
            onChange(res.iso)
          }
          setBuffer(formatLocalDate(res.iso, locale))
          setIsDirty(false)
          setHasFailedBoundary(false)
          return
        }
      }

      if (res.valid && res.iso === null) {
        if (value !== null) {
          onChange(null)
        }
        setBuffer('')
        setIsDirty(false)
        setHasFailedBoundary(false)
        return
      }

      setBuffer(
        value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
      )
      setIsDirty(false)
      setHasFailedBoundary(true)
    }, [buffer, locale, value, min, max, isDateUnavailable, onChange, isDirty])

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
        onChange(nextDate)
        // Picker selection is a programmatic value echo: it reformats the
        // input and ends any dirty session (DF-CMT-05 shape).
        setBuffer(
          nextDate != null && isValidISODate(nextDate)
            ? formatLocalDate(nextDate, locale)
            : (nextDate ?? '')
        )
        setIsDirty(false)
        setHasFailedBoundary(false)
        setIsOpen(false)
      },
      [onChange, locale, min, max, isDateUnavailable]
    )

    // Live typing path: every keystroke joins the dirty buffer; only a
    // complete valid in-constraints date requests, and only when it
    // differs from the prop. Partial, impossible, and out-of-constraints
    // text stays visible and silent.
    const handleInput = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return
        const nextText = e.target.value
        setIsDirty(true)
        setBuffer(nextText)

        if (isComposingRef.current) return

        const res = parseLocalDate(nextText, locale)
        if (res.valid && res.iso === null) {
          if (value !== null) {
            onChange(null)
          }
        } else if (res.valid && res.iso) {
          if (
            res.iso !== value &&
            isDateWithinConstraints(
              res.iso,
              min as CanonicalISODate,
              max as CanonicalISODate,
              isDateUnavailable
            )
          ) {
            onChange(res.iso)
          }
        }
      },
      [disabled, readOnly, locale, value, min, max, isDateUnavailable, onChange]
    )

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.defaultPrevented || disabled) return

        // Enter is a commit boundary (DF-CMT-01). ArrowUp/Down stepping is
        // PATCHES #2, out of scope: those keys stay native no-ops here
        // (DF-KEY-05/06 pin the no-op).
        if (e.key === 'Enter') {
          commit()
        } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
          e.preventDefault()
          setIsOpen(true)
        } else if (e.key === 'Escape' && isOpen) {
          e.preventDefault()
          setIsOpen(false)
        }
      },
      [disabled, isOpen, commit]
    )

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.defaultPrevented) return
        commit()
      },
      [commit]
    )

    const handleClick = React.useCallback(() => {
      if (disabled) return
      setIsOpen(true)
    }, [disabled])

    // Composition suspends parsing and commit; the native input event
    // carrying the finalized text runs the live path, so compositionend
    // only clears the flag — and a flag already cleared by a programmatic
    // value/locale replace marks the end stale and ignored (DF-CMT-07).
    const handleCompositionStart = React.useCallback(() => {
      isComposingRef.current = true
    }, [])

    const handleCompositionEnd = React.useCallback(() => {
      if (!isComposingRef.current) return
      isComposingRef.current = false
    }, [])

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
