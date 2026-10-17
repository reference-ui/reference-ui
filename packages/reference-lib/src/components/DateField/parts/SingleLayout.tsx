/**
 * Single-field layout: unfolds the registered input and trigger slots
 * into the managed input and its toggle. The engine display shows the
 * dirty buffer while editing, else the locale-formatted controlled
 * value; managed invalid, editing, and empty states always win while
 * authored handlers run first with preventDefault() canceling the
 * machine default.
 */
import * as React from 'react'
import { Input } from '@reference-ui/react'
import { CalendarTodayIcon } from '@reference-ui/icons'
import { Overlay } from '../../Overlay'
import { isValidISODate } from '../../Calendar/dates/iso'
import { DateFieldContext } from '../context'
import { formatLocalDate } from '../engine/parse'
import { mergeClassNames, mergeStyles } from '../shared/merge'
import { useSlot } from '../slots/slots'

export function DateFieldLayout() {
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

  // Engine display: the dirty buffer while editing, else the
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
