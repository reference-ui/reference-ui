import * as React from 'react'

export interface ComboboxOptionEntry {
  value: string
  id: string
  node: HTMLElement | null
  disabled?: boolean
  textValue?: string
}

export interface ComboboxContextValue {
  value: string | null
  inputValue: string
  isOpen: boolean
  disabled: boolean
  setIsOpen: (open: boolean) => void
  handleSelect: (val: string | null) => void
  handleInputChange: (val: string) => void
  sourceRef: React.MutableRefObject<HTMLElement | null>
  activeValue: string | null
  setActiveValue: (val: string | null) => void
  activeOptionId: string | null
  registerOption: (entry: ComboboxOptionEntry) => () => void
  getOrderedOptions: () => ComboboxOptionEntry[]
}

export const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
