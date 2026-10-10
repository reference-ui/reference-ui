/**
 * Combobox's editable focus source: the Input part. It rejects direct
 * value/onChange (root text authority only), anchors the popover to the
 * Field node when nested, renders the inline-completed display value,
 * and wires change/click/blur/composition handlers with the keyboard
 * hook. Focus alone never opens; edits request open under the content
 * gate; blur resolves outside focus. All decisions live in the hooks.
 */
import * as React from 'react'
import { Input } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'
import { ComboboxContext } from '../combobox-context'
import { useInlineCompletion, useInputAnchor, useInputKeyboard } from '../hooks'
import { comboboxDiagnostic } from '../shared/diagnostic'
import type { ComboboxInputProps } from '../types'

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    {
      value: forbiddenValue,
      defaultValue: forbiddenDefaultValue,
      onChange,
      onClick,
      onKeyDown,
      onFocus,
      onBlur,
      onCompositionStart,
      onCompositionEnd,
      disabled: disabledProp,
      readOnly,
      className,
      style,
      ...props
    }: ComboboxInputProps,
    userRef
  ) {
  const rawProps = { value: forbiddenValue, defaultValue: forbiddenDefaultValue, onChange }
  if (rawProps.value !== undefined || rawProps.defaultValue !== undefined) {
    comboboxDiagnostic(
      'Combobox.Input does not accept value or defaultValue. Use root inputValue and onInputValueChange.'
    )
  }
  if (rawProps.onChange !== undefined) {
    comboboxDiagnostic(
      'Combobox.Input does not accept onChange. Use root onInputValueChange; observe the native edit through onInput or cancel it through onBeforeInput.'
    )
  }

  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const inputValue = context?.inputValue ?? ''
  const isOpen = context?.isOpen ?? false
  const disabled = context?.disabled ?? false
  const setIsOpen = context?.setIsOpen
  const handleInputChange = context?.handleInputChange
  const popoverId = context?.popoverId
  const registerFocusSource = context?.registerFocusSource

  const { inputRef, composedRef } = useInputAnchor(
    context?.sourceRef,
    overlay,
    registerFocusSource,
    userRef
  )
  const { displayValue, isComposingRef, handleCompositionStart, handleCompositionEnd } =
    useInlineCompletion(context, inputRef, onCompositionStart, onCompositionEnd)

  const isDisabled = disabled || disabledProp
  const isReadOnly = Boolean(readOnly)

  const handleKeyDown = useInputKeyboard({
    context,
    inputRef,
    isComposingRef,
    isDisabled,
    isReadOnly,
    isOpen,
    setIsOpen,
    onKeyDown,
  })

  if (!context || !setIsOpen || !handleInputChange) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // No consumer onChange observer (CB-DOM-11): root onInputValueChange
    // is the only text callback path. Consumers cancel the edit earlier
    // through onBeforeInput (CB-OPEN-07 type third), which prevents the
    // native edit and this event together.
    if (!e.defaultPrevented && !isDisabled && !isReadOnly) {
      handleInputChange(e.target.value)
      // #10: an edit requests open only when popover collection content
      // exists (CB-OPEN-03). The text request above always fires.
      if (!isOpen && context.hasPopoverContent) setIsOpen(true)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly && !isOpen) {
      setIsOpen(true)
    }
  }

  // #11: focus alone never opens. Deliberate open comes only from
  // arrows, real edits under the content gate, and Trigger activation.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e)
  }

  // #3: blur is not cancelable, so the consumer handler observes only;
  // outside-focus commit-or-revert + dismissal always runs.
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e)
    if (!isDisabled) {
      context.handleSourceBlur(e.relatedTarget)
    }
  }

  return (
    <Input
      {...props}
      ref={composedRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete={context.autocomplete}
      aria-haspopup={context.popupRole}
      aria-controls={popoverId}
      aria-activedescendant={isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      readOnly={readOnly}
      value={displayValue}
      onChange={handleChange}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
      style={style}
    />
  )
  }
)
