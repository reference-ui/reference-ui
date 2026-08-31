import * as React from 'react'

export interface ComboboxContextValue {
  value: string | null
  inputValue: string
  isOpen: boolean
  disabled: boolean
  setIsOpen: (open: boolean) => void
  handleSelect: (val: string | null) => void
  handleInputChange: (val: string) => void
  sourceRef: React.MutableRefObject<HTMLElement | null>
}

export const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
