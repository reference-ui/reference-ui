/**
 * Tree's public contract: root, item, group, and expander props plus the
 * internal tree/item scope shapes parts and hooks share. Kept free of JSX
 * and logic so parts, hooks, and consumers can import the shape without
 * mounting anything.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type * as React from 'react'

export type TreeProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  /**
   * Controlled selection. Required standalone (omission throws); optional
   * inside Combobox, where it displays `combobox.value` when omitted and
   * the root owns commits either way (TR-CB-04).
   */
  value?: string | null
  /**
   * Selection requests. Required standalone (omission throws); forbidden
   * inside Combobox — a nested onChange diagnoses and is never invoked,
   * because activation commits only through root onChange (TR-CB-04).
   */
  onChange?: (value: string | null) => void
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  disabled?: boolean
}

export interface TreeContextValue {
  value: string | null
  expanded: string[]
  disabled: boolean
  focusedId: string | null
  setFocusedId: (id: string | null) => void
  isItemSelected: (id: string) => boolean
  isItemExpanded: (id: string) => boolean
  selectItem: (id: string) => void
  toggleExpanded: (id: string) => void
  registerItemInstance: (id: string) => () => void
  registerBranchOrder: (id: string, el: HTMLElement | null) => () => void
  handleItemKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    id: string,
    itemEl: HTMLDivElement | null,
    isBranch: boolean,
    isExpanded: boolean
  ) => void
}

export interface TreeItemContextValue {
  id: string
  isBranch: boolean
  isExpanded: boolean
  level: number
  groupId: string
}

export type TreeItemProps = PrimitiveProps<'div'> & {
  id?: string
  value?: string
  disabled?: boolean
  isBranch?: boolean
  textValue?: string
}

export type TreeGroupProps = PrimitiveProps<'div'>

export type TreeExpanderProps = PrimitiveProps<'button'> & {
  expanded?: boolean
  onToggle?: () => void
  itemId?: string
}
