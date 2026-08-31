import * as React from 'react'
import { Overlay } from '../Overlay'
import { Listbox, type ListboxOptionProps } from '../Listbox'

export interface ComboboxProps {
  children?: React.ReactNode
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  inputValue?: string
  defaultInputValue?: string
  onInputChange?: (inputValue: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

interface ComboboxContextValue {
  value: string | null
  inputValue: string
  isOpen: boolean
  disabled: boolean
  setIsOpen: (open: boolean) => void
  handleSelect: (val: string | null) => void
  handleInputChange: (val: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

export function ComboboxInput({
  onChange,
  onKeyDown,
  onFocus,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'input'>) {
  const context = React.useContext(ComboboxContext)
  if (!context) return null

  const { inputValue, isOpen, disabled, setIsOpen, handleInputChange } = context

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (!e.defaultPrevented) {
      handleInputChange(e.target.value)
      if (!isOpen) {
        setIsOpen(true)
      }
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
    <input
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
      style={{
        width: '100%',
        padding: '6px 10px',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid #ccc',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  )
}

export function ComboboxTrigger({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Overlay.Trigger aria-haspopup="listbox" {...props}>
      {children}
    </Overlay.Trigger>
  )
}

export function ComboboxPopover({
  children,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const context = React.useContext(ComboboxContext)

  return (
    <Overlay.Portal>
      <Overlay.Content
        role="presentation"
        className={className}
        style={{
          minWidth: 200,
          backgroundColor: '#fff',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          padding: 4,
          zIndex: 50,
          ...style,
        }}
        {...props}
      >
        <Listbox
          value={context?.value}
          onChange={(nextVal) => context?.handleSelect(nextVal)}
          style={{ border: 'none', padding: 0 }}
        >
          {children}
        </Listbox>
      </Overlay.Content>
    </Overlay.Portal>
  )
}

export function ComboboxOption(props: ListboxOptionProps) {
  return <Listbox.Option {...props} />
}

export function Combobox({
  children,
  value: valueProp,
  defaultValue = null,
  onChange,
  inputValue: inputValProp,
  defaultInputValue = '',
  onInputChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
}: ComboboxProps) {
  const isControlledValue = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(defaultValue)
  const value = isControlledValue ? valueProp : internalValue

  const isControlledInput = inputValProp !== undefined
  const [internalInput, setInternalInput] = React.useState<string>(defaultInputValue)
  const inputValue = isControlledInput ? inputValProp : internalInput

  const isControlledOpen = openProp !== undefined
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
  const isOpen = isControlledOpen ? openProp : internalOpen

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlledOpen, onOpenChange]
  )

  const handleInputChange = React.useCallback(
    (nextInput: string) => {
      if (!isControlledInput) {
        setInternalInput(nextInput)
      }
      onInputChange?.(nextInput)
    },
    [isControlledInput, onInputChange]
  )

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      if (!isControlledValue) {
        setInternalValue(nextVal)
      }
      onChange?.(nextVal)
      if (nextVal !== null) {
        handleInputChange(nextVal)
      }
      setIsOpen(false)
    },
    [isControlledValue, onChange, handleInputChange, setIsOpen]
  )

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      value,
      inputValue,
      isOpen,
      disabled,
      setIsOpen,
      handleSelect,
      handleInputChange,
    }),
    [value, inputValue, isOpen, disabled, setIsOpen, handleSelect, handleInputChange]
  )

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
        <div data-reference-combobox="" style={{ position: 'relative' }}>
          {children}
        </div>
      </Overlay>
    </ComboboxContext.Provider>
  )
}

Combobox.Input = ComboboxInput
Combobox.Trigger = ComboboxTrigger
Combobox.Popover = ComboboxPopover
Combobox.Option = ComboboxOption
