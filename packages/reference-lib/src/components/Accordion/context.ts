/**
 * Accordion's private subtree scope: the expansion policy (single or
 * multiple), the open/toggle authority over item ids, and the root disabled
 * flag. The root provides it, item Collapsibles consume it through
 * Collapsible's deep import, and item children are re-scoped to null so a
 * nested standalone disclosure never becomes an Accordion item.
 */
import * as React from 'react'

export interface AccordionContextValue {
  expansion: 'single' | 'multiple'
  isItemOpen: (id: string) => boolean
  toggleItem: (id: string) => void
  disabled: boolean
}

export const AccordionContext = React.createContext<AccordionContextValue | null>(null)
