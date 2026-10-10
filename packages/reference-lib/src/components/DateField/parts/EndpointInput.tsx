/**
 * Range endpoint input: unfolds one registered Start/End slot into its
 * managed field. The Part-Resolution Law runs per endpoint — explicit
 * props decorate, managed state and accessibility always win, authored
 * handlers run first — while the root leg stays vacuous by design:
 * root shorthands cannot address two inputs, so the root seeds only
 * the bezel.
 */
import * as React from 'react'
import { Input } from '@reference-ui/react'
import { isValidISODate } from '../../Calendar/dates/iso'
import { DateFieldRangeContext } from '../context'
import { formatLocalDate } from '../engine/parse'
import { mergeClassNames, mergeStyles } from '../shared/merge'
import { useSlot } from '../slots/slots'
import type { DateFieldRangeEndpoint } from '../types'

export function RangeEndpointInput({ endpoint }: { endpoint: DateFieldRangeEndpoint }) {
  const context = React.useContext(DateFieldRangeContext)
  const slot = useSlot(endpoint)
  if (!context) return null

  const {
    rangeValue,
    locale,
    isOpen,
    canApply: _canApply,
    activeEndpoint: _activeEndpoint,
    disabled,
    readOnly,
    required,
    pickerId,
    endpointRefs,
    buffers,
    isDirty,
    failed,
    constraintInvalid,
    handleEndpointInput,
    handleEndpointKeyDown,
    handleEndpointBlur,
    handleEndpointFocus,
    handleEndpointClick,
    handleCompositionStart,
    handleCompositionEnd,
    rootHandlers,
  } = context

  const pickerSlot = useSlot('picker')
  const isPickerPresent = Boolean(pickerSlot)
  void _canApply
  void _activeEndpoint

  const committedEndpoint = rangeValue?.[endpoint] ?? null
  const displayText = isDirty
    ? buffers[endpoint]
    : committedEndpoint != null && isValidISODate(committedEndpoint)
      ? formatLocalDate(committedEndpoint, locale)
      : (committedEndpoint ?? '')
  const isInvalid = failed || constraintInvalid[endpoint]
  const isEmpty = isDirty ? buffers[endpoint] === '' : committedEndpoint === null

  // Part-Resolution Law per endpoint: explicit Start/End props decorate,
  // managed state and accessibility always win, authored handlers run first.
  // (Root shorthands cannot address two inputs, so the root seeds only the
  // bezel — the law's root leg is vacuous for Range by design.)
  const explicitProps = (slot?.element.props as Record<string, any> | undefined) ?? {}
  const explicitRef = slot?.meta?.ref as React.Ref<HTMLInputElement> | undefined
  const ownRef = endpointRefs[endpoint]

  const composedRef = (node: HTMLInputElement | null) => {
    ownRef.current = node
    if (typeof explicitRef === 'function') {
      explicitRef(node)
    } else if (explicitRef && typeof explicitRef === 'object') {
      ;(explicitRef as React.RefObject<HTMLInputElement | null>).current = node
    }
  }

  const isDisabled = explicitProps.disabled ?? disabled
  const isReadOnly = explicitProps.readOnly ?? readOnly
  const isRequired = explicitProps.required ?? required
  const placeholder = explicitProps.placeholder
  const className = mergeClassNames(explicitProps.className)
  const style = mergeStyles(explicitProps.style)
  const inputId = explicitProps.id

  const onChangeComposed = (e: React.ChangeEvent<HTMLInputElement>) => {
    explicitProps.onChange?.(e)
    handleEndpointInput(endpoint, e)
  }
  const onKeyDownComposed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    explicitProps.onKeyDown?.(e)
    rootHandlers.onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointKeyDown(endpoint, e)
    }
  }
  const onBlurComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onBlur?.(e)
    rootHandlers.onBlur?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointBlur(endpoint, e)
    }
  }
  const onFocusComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onFocus?.(e)
    rootHandlers.onFocus?.(e)
    handleEndpointFocus(endpoint)
  }
  const onClickComposed = (e: React.MouseEvent<HTMLInputElement>) => {
    explicitProps.onClick?.(e)
    rootHandlers.onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointClick(endpoint)
    }
  }
  const onCompositionStartComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionStart?.(e)
    handleCompositionStart(endpoint)
  }
  const onCompositionEndComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionEnd?.(e)
    handleCompositionEnd(endpoint)
  }

  const explicitAriaInvalid = explicitProps['aria-invalid']
  const ariaInvalid = isInvalid ? true : explicitAriaInvalid

  const {
    className: _xClassName,
    style: _xStyle,
    placeholder: _xPlaceholder,
    id: _xId,
    'aria-invalid': _xAriaInvalid,
    onInput: _xOnInput,
    onChange: _xOnChange,
    onKeyDown: _xOnKeyDown,
    onFocus: _xOnFocus,
    onBlur: _xOnBlur,
    onClick: _xOnClick,
    onCompositionStart: _xOnCompositionStart,
    onCompositionEnd: _xOnCompositionEnd,
    value: _xValue,
    defaultValue: _xDefaultValue,
    disabled: _xDisabled,
    readOnly: _xReadOnly,
    required: _xRequired,
    autoComplete: _xAutoComplete,
    autoCorrect: _xAutoCorrect,
    spellCheck: _xSpellCheck,
    inputMode: _xInputMode,
    role: _xRole,
    type: _xType,
    children: _xChildren,
    ...restExplicitProps
  } = explicitProps

  return (
    <Input
      {...restExplicitProps}
      ref={composedRef}
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
      data-reference-date-endpoint={endpoint}
      inputMode="text"
      autoComplete={explicitProps.autoComplete ?? 'off'}
      autoCorrect={explicitProps.autoCorrect ?? 'off'}
      spellCheck={explicitProps.spellCheck ?? false}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      placeholder={placeholder}
      value={displayText}
      onInput={explicitProps.onInput}
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
}
