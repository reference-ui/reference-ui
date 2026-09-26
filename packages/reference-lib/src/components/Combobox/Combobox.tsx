import * as React from 'react'
import { Input, Button, type PrimitiveProps } from '@reference-ui/react'
import { Overlay, useOverlay, type OverlayContentProps } from '../Overlay'
import {
  ListboxOption,
  ListboxSection,
  ListboxEmpty,
  type ListboxOptionProps,
} from '../Listbox'
import { ComboboxContext, type ComboboxOptionEntry } from './combobox-context'

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Same pattern as Overlay's warn helper.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function comboboxDiagnostic(message: string) {
  const isProd = globalProcess?.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[reference-ui] Combobox: ${message}`)
  }
}

function sanitizeComboboxId(rawId: string) {
  return `ref-cb-pop-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export interface ComboboxProps {
  children?: React.ReactNode
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  onInputChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onDismiss?: () => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

export type ComboboxInputProps = Omit<PrimitiveProps<'input'>, 'value' | 'defaultValue'> & {
  value?: never
  defaultValue?: never
}

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    {
      value: forbiddenValue,
      defaultValue: forbiddenDefaultValue,
      onChange,
      onClick,
      onKeyDown,
      onFocus,
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
  const rawProps = { value: forbiddenValue, defaultValue: forbiddenDefaultValue }
  if (rawProps.value !== undefined || rawProps.defaultValue !== undefined) {
    comboboxDiagnostic(
      'Combobox.Input does not accept value or defaultValue. Use root inputValue and onInputValueChange.'
    )
  }

  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const isComposingRef = React.useRef(false)
  const sourceRef = context?.sourceRef
  const inputValue = context?.inputValue ?? ''
  const isOpen = context?.isOpen ?? false
  const disabled = context?.disabled ?? false
  const setIsOpen = context?.setIsOpen
  const handleInputChange = context?.handleInputChange
  const popoverId = context?.popoverId
  const registerFocusSource = context?.registerFocusSource

  const assignAnchor = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      const host = (node?.closest('[data-reference-field]') as HTMLElement | null) ?? node
      if (sourceRef) sourceRef.current = host
      if (overlay) overlay.triggerRef.current = host
    },
    [overlay, sourceRef]
  )

  const composedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      assignAnchor(node)
      if (typeof userRef === 'function') {
        userRef(node)
      } else if (userRef && 'current' in userRef) {
        ;(userRef as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    },
    [assignAnchor, userRef]
  )

  React.useLayoutEffect(() => {
    assignAnchor(inputRef.current)
  })

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('input')
  }, [registerFocusSource])

  if (!context || !setIsOpen || !handleInputChange) return null

  const isDisabled = disabled || disabledProp
  const isReadOnly = Boolean(readOnly)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly) {
      handleInputChange(e.target.value)
      if (!isOpen) setIsOpen(true)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly) {
      setIsOpen(true)
    }
  }

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionStart?.(e)
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionEnd?.(e)
    isComposingRef.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || isReadOnly) return
    // IME composition owns the key: take no action and shield the
    // document-level Overlay Escape listener, while leaving the native
    // default (composition cancel) untouched (CB-EDIT-05/09).
    if (
      isComposingRef.current ||
      e.key === 'Process' ||
      e.nativeEvent.isComposing ||
      (e.nativeEvent as KeyboardEvent).keyCode === 229
    ) {
      e.stopPropagation()
      return
    }

    const getEnabledOptions = () => {
      return context.getOrderedOptions().filter(opt => !opt.disabled)
    }

    // The active value can go stale when its option unmounts (dynamic
    // collections); only a still-mounted option may commit (CB-NAV-07).
    const mountedActiveValue =
      context.activeValue != null &&
      getEnabledOptions().some(opt => opt.value === context.activeValue)
        ? context.activeValue
        : null

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          const currentIndex = enabled.findIndex(opt => opt.value === context.activeValue)
          let nextIndex = currentIndex + 1
          if (nextIndex >= enabled.length || currentIndex === -1) nextIndex = 0
          const nextOption = enabled[nextIndex]
          if (nextOption) {
            context.setActiveValue(nextOption.value)
            nextOption.node?.scrollIntoView({ block: 'nearest' })
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          const currentIndex = enabled.findIndex(opt => opt.value === context.activeValue)
          let prevIndex = currentIndex - 1
          if (prevIndex < 0 || currentIndex === -1) prevIndex = enabled.length - 1
          const prevOption = enabled[prevIndex]
          if (prevOption) {
            context.setActiveValue(prevOption.value)
            prevOption.node?.scrollIntoView({ block: 'nearest' })
          }
        }
      }
    } else if (e.key === 'Enter') {
      if (isOpen && mountedActiveValue != null) {
        e.preventDefault()
        context.handleSelect(mountedActiveValue)
      }
    } else if (e.key === 'Tab') {
      if (isOpen && mountedActiveValue != null) {
        context.handleSelect(mountedActiveValue)
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        context.revertToCommittedText()
        context.setActiveValue(null)
        setIsOpen(false)
      }
    }
  }

  return (
    <Input
      {...props}
      ref={composedRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-controls={popoverId}
      aria-activedescendant={isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      readOnly={readOnly}
      value={inputValue}
      onChange={handleChange}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
      style={style}
    />
  )
  }
)

export type ComboboxTriggerProps = PrimitiveProps<'button'>

export const ComboboxTrigger = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  function ComboboxTrigger(
    {
      children,
      onClick,
      disabled: disabledProp,
      className,
      style,
      ...props
    }: ComboboxTriggerProps,
    userRef
  ) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const registerFocusSource = context?.registerFocusSource

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('trigger')
  }, [registerFocusSource])

  if (!context) return null

  const composedRef = (node: HTMLButtonElement | null) => {
    context.sourceRef.current = node
    if (overlay) overlay.triggerRef.current = node
    if (typeof userRef === 'function') {
      userRef(node)
    } else if (userRef && 'current' in userRef) {
      ;(userRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  const isDisabled = context.disabled || disabledProp

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      context.setIsOpen(!context.isOpen)
    }
  }

  return (
    <Button
      {...props}
      ref={composedRef}
      type="button"
      role="combobox"
      aria-expanded={context.isOpen}
      aria-haspopup="listbox"
      aria-controls={context.popoverId}
      aria-activedescendant={context.isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      className={`ref-input ${className || ''}`}
      style={style}
    >
      {children}
    </Button>
  )
  }
)

export type ComboboxPopoverProps = OverlayContentProps

export function ComboboxPopover({
  children,
  style,
  id: idProp,
  ...props
}: ComboboxPopoverProps) {
  const context = React.useContext(ComboboxContext)
  const registerPopover = context?.registerPopover

  React.useLayoutEffect(() => {
    if (registerPopover) return registerPopover(idProp)
  }, [registerPopover, idProp])

  const id = idProp ?? context?.popoverId

  return (
    <Overlay.Content
      data-reference-combobox-popover=""
      role="presentation"
      placement="bottom-start"
      p="1r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      id={id}
      style={{
        minWidth: 'var(--reference-overlay-anchor-width, 12.5rem)',
        ...style,
      }}
      {...props}
    >
      {children}
    </Overlay.Content>
  )
}

export function ComboboxOption(props: ListboxOptionProps) {
  return <ListboxOption {...props} />
}

export function Combobox({
  children,
  value: valueProp,
  defaultValue = null,
  onChange,
  inputValue: inputValProp,
  defaultInputValue,
  onInputValueChange,
  onInputChange,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onDismiss,
  onOpenChange,
  disabled = false,
}: ComboboxProps) {
  const isControlledValue = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(defaultValue)
  const value = isControlledValue ? valueProp : internalValue

  const isControlledInput = inputValProp !== undefined
  const [internalInput, setInternalInput] = React.useState<string>(
    () => defaultInputValue ?? (value ? String(value) : '')
  )
  const inputValue = isControlledInput ? inputValProp : internalInput

  const isControlledOpen = openProp !== undefined
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
  const isOpen = isControlledOpen ? openProp : internalOpen
  const sourceRef = React.useRef<HTMLElement | null>(null)

  const rawDefaultPopoverId = React.useId()
  const [popoverId, setPopoverId] = React.useState<string>(() =>
    sanitizeComboboxId(rawDefaultPopoverId)
  )
  const focusSourcesCountRef = React.useRef(0)
  const popoverCountRef = React.useRef(0)

  const [activeValue, setActiveValue] = React.useState<string | null>(value ?? null)
  const optionsMapRef = React.useRef<Map<string, ComboboxOptionEntry>>(new Map())
  // Registration mutates the map (no render on its own), so each
  // register/unregister also bumps a version to recompute the mounted-only
  // active ID. The bump carries no data — the map is still the source.
  const [, setOptionsVersion] = React.useState(0)

  const registerOption = React.useCallback((entry: ComboboxOptionEntry) => {
    optionsMapRef.current.set(entry.value, entry)
    setOptionsVersion(v => v + 1)
    return () => {
      optionsMapRef.current.delete(entry.value)
      setOptionsVersion(v => v + 1)
    }
  }, [])

  const getOrderedOptions = React.useCallback((): ComboboxOptionEntry[] => {
    const entries = Array.from(optionsMapRef.current.values())
    return entries
      .filter(entry => entry.node && entry.node.isConnected)
      .sort((a, b) => {
        const pos = a.node!.compareDocumentPosition(b.node!)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
  }, [])

  const registerFocusSource = React.useCallback((_type: 'input' | 'trigger') => {
    focusSourcesCountRef.current += 1
    if (focusSourcesCountRef.current > 1) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected multiple focus sources.'
      )
    }
    return () => {
      focusSourcesCountRef.current -= 1
    }
  }, [])

  const registerPopover = React.useCallback((id?: string) => {
    popoverCountRef.current += 1
    if (id) setPopoverId(id)
    if (popoverCountRef.current > 1) {
      comboboxDiagnostic('Combobox allows at most one Popover. Detected duplicate Popovers.')
    }
    return () => {
      popoverCountRef.current -= 1
    }
  }, [])

  React.useLayoutEffect(() => {
    if (focusSourcesCountRef.current === 0) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected 0 focus sources.'
      )
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      setActiveValue(value ?? null)
    } else {
      setActiveValue(null)
    }
  }, [isOpen, value])

  const effectiveActive = activeValue ?? (isOpen ? value : null)
  const activeOption = effectiveActive ? optionsMapRef.current.get(effectiveActive) : null
  const activeOptionId =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? activeOption.id
      : null

  const notifyInput = onInputValueChange ?? onInputChange

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) onOpen?.()
      if (!isControlledOpen) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) onDismiss?.()
    },
    [isControlledOpen, isOpen, onOpen, onOpenChange, onDismiss]
  )

  const handleInputChange = React.useCallback(
    (nextInput: string) => {
      if (!isControlledInput) setInternalInput(nextInput)
      notifyInput?.(nextInput)
      const enabled = getOrderedOptions().filter(opt => !opt.disabled)
      if (enabled.length > 0) {
        setActiveValue(enabled[0].value)
      }
    },
    [isControlledInput, notifyInput, getOrderedOptions]
  )

  const revertToCommittedText = React.useCallback(() => {
    const committedLabel =
      value != null ? (optionsMapRef.current.get(value)?.textValue ?? String(value)) : ''
    if (inputValue !== committedLabel) {
      handleInputChange(committedLabel)
    }
  }, [value, inputValue, handleInputChange])

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      if (!isControlledValue) setInternalValue(nextVal)
      onChange?.(nextVal)
      if (nextVal !== null && !isControlledInput) {
        const selectedOpt = optionsMapRef.current.get(nextVal)
        const labelText = selectedOpt?.textValue ?? nextVal
        handleInputChange(labelText)
      }
      setIsOpen(false)
    },
    [isControlledValue, isControlledInput, onChange, handleInputChange, setIsOpen]
  )

  const contextValue = React.useMemo(
    () => ({
      value,
      inputValue,
      isOpen,
      disabled,
      setIsOpen,
      handleSelect,
      handleInputChange,
      sourceRef,
      activeValue,
      setActiveValue,
      activeOptionId,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
    }),
    [
      value,
      inputValue,
      isOpen,
      disabled,
      setIsOpen,
      handleSelect,
      handleInputChange,
      activeValue,
      setActiveValue,
      activeOptionId,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
    ]
  )

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onDismiss={() => setIsOpen(false)}
        isolation={false}
        closeOnScroll
        anchor={sourceRef}
      >
        {children}
      </Overlay>
    </ComboboxContext.Provider>
  )
}

Combobox.Input = ComboboxInput
Combobox.Trigger = ComboboxTrigger
Combobox.Popover = ComboboxPopover
Combobox.Option = ComboboxOption
Combobox.Section = ListboxSection
Combobox.Empty = ListboxEmpty
