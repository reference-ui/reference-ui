import * as React from 'react'
import { Input, Button, type PrimitiveProps } from '@reference-ui/react'
import { Overlay, useOverlay, type OverlayContentProps } from '../Overlay'
import { ListboxOption, type ListboxOptionProps } from '../Listbox'
import { ComboboxContext } from './combobox-context'

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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e)
    if (!e.defaultPrevented && !disabled) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return

    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault()
      setIsOpen(true)
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  return (
    <Input
      ref={assignAnchor}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      disabled={disabled}
      value={inputValue}
      onChange={handleChange}
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
    },
    [isControlledInput, notifyInput]
  )

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      if (!isControlledValue) setInternalValue(nextVal)
      onChange?.(nextVal)
      if (nextVal !== null && !isControlledInput) {
        handleInputChange(nextVal)
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
    }),
    [value, inputValue, isOpen, disabled, setIsOpen, handleSelect, handleInputChange]
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
