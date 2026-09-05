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

export type ComboboxInputProps = Omit<PrimitiveProps<'input'>, 'value' | 'defaultValue'>

export function ComboboxInput({
  onChange,
  onClick,
  onKeyDown,
  onFocus,
  className,
  style,
  ...props
}: ComboboxInputProps) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const sourceRef = context?.sourceRef
  const inputValue = context?.inputValue ?? ''
  const isOpen = context?.isOpen ?? false
  const disabled = context?.disabled ?? false
  const setIsOpen = context?.setIsOpen
  const handleInputChange = context?.handleInputChange

  const assignAnchor = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      const host = (node?.closest('[data-reference-field]') as HTMLElement | null) ?? node
      if (sourceRef) sourceRef.current = host
      if (overlay) overlay.triggerRef.current = host
    },
    [overlay, sourceRef]
  )

  React.useLayoutEffect(() => {
    assignAnchor(inputRef.current)
  })

  if (!context || !setIsOpen || !handleInputChange) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (!e.defaultPrevented) {
      handleInputChange(e.target.value)
      if (!isOpen) setIsOpen(true)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !disabled && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e)
    if (!e.defaultPrevented && !disabled) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return

    const getEnabledOptions = () => {
      return context.getOrderedOptions().filter(opt => !opt.disabled)
    }

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
    } else if (e.key === 'Home') {
      if (isOpen) {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          e.preventDefault()
          context.setActiveValue(enabled[0].value)
          enabled[0].node?.scrollIntoView({ block: 'nearest' })
        }
      }
    } else if (e.key === 'End') {
      if (isOpen) {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          e.preventDefault()
          const lastOption = enabled[enabled.length - 1]
          context.setActiveValue(lastOption.value)
          lastOption.node?.scrollIntoView({ block: 'nearest' })
        }
      }
    } else if (e.key === 'PageDown') {
      if (isOpen) {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          e.preventDefault()
          const currentIndex = enabled.findIndex(opt => opt.value === context.activeValue)
          const nextIndex = Math.min(enabled.length - 1, (currentIndex === -1 ? 0 : currentIndex) + 5)
          const nextOption = enabled[nextIndex]
          context.setActiveValue(nextOption.value)
          nextOption.node?.scrollIntoView({ block: 'nearest' })
        }
      }
    } else if (e.key === 'PageUp') {
      if (isOpen) {
        const enabled = getEnabledOptions()
        if (enabled.length > 0) {
          e.preventDefault()
          const currentIndex = enabled.findIndex(opt => opt.value === context.activeValue)
          const prevIndex = Math.max(0, (currentIndex === -1 ? enabled.length - 1 : currentIndex) - 5)
          const prevOption = enabled[prevIndex]
          context.setActiveValue(prevOption.value)
          prevOption.node?.scrollIntoView({ block: 'nearest' })
        }
      }
    } else if (e.key === 'Enter') {
      if (isOpen && context.activeValue != null) {
        e.preventDefault()
        context.handleSelect(context.activeValue)
      }
    } else if (e.key === 'Tab') {
      if (isOpen && context.activeValue != null) {
        context.handleSelect(context.activeValue)
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
      } else if (inputValue !== '') {
        e.preventDefault()
        handleInputChange(context.value ?? '')
      }
    }
  }

  return (
    <Input
      ref={assignAnchor}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-activedescendant={isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={disabled}
      value={inputValue}
      onChange={handleChange}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={className}
      style={style}
      {...props}
    />
  )
}

export type ComboboxTriggerProps = PrimitiveProps<'button'>

export function ComboboxTrigger({
  children,
  onClick,
  className,
  style,
  ...props
}: ComboboxTriggerProps) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  if (!context) return null

  const composedRef = (node: HTMLButtonElement | null) => {
    context.sourceRef.current = node
    if (overlay) overlay.triggerRef.current = node
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !context.disabled) {
      context.setIsOpen(!context.isOpen)
    }
  }

  return (
    <Button
      ref={composedRef}
      type="button"
      role="combobox"
      aria-expanded={context.isOpen}
      aria-haspopup="listbox"
      disabled={context.disabled}
      onClick={handleClick}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type ComboboxPopoverProps = OverlayContentProps

export function ComboboxPopover({
  children,
  style,
  ...props
}: ComboboxPopoverProps) {
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
      zIndex={50}
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

  const [activeValue, setActiveValue] = React.useState<string | null>(value ?? null)
  const optionsMapRef = React.useRef<Map<string, ComboboxOptionEntry>>(new Map())

  const registerOption = React.useCallback((entry: ComboboxOptionEntry) => {
    optionsMapRef.current.set(entry.value, entry)
    return () => {
      optionsMapRef.current.delete(entry.value)
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

  React.useEffect(() => {
    if (isOpen) {
      setActiveValue(value ?? null)
    } else {
      setActiveValue(null)
    }
  }, [isOpen, value])

  const effectiveActive = activeValue ?? (isOpen ? value : null)
  const activeOption = effectiveActive ? optionsMapRef.current.get(effectiveActive) : null
  const activeOptionId = effectiveActive ? (activeOption?.id ?? `ref-opt-${effectiveActive}`) : null

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
