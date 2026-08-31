import * as React from 'react'

export interface AccordionContextValue {
  expansion: 'single' | 'multiple'
  isItemOpen: (id: string) => boolean
  toggleItem: (id: string) => void
  disabled: boolean
}

export const AccordionContext = React.createContext<AccordionContextValue | null>(null)
