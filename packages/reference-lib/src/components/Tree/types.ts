/**
 * Tree's public contract: root, item, group, and expander props plus the
 * internal tree/item scope shapes parts and hooks share. Kept free of JSX
 * and logic so parts, hooks, and consumers can import the shape without
 * mounting anything.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type * as React from 'react'

export type TreeProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  /** Required. The selected item; `null` for none. */
  value?: string | null
  /** Required. Called when an item is selected. */
  onChange?: (value: string | null) => void
  /** Controlled expanded branches. */
  expanded?: string[]
  /**
   * Branches expanded on first render when `expanded` is omitted.
   * @default []
   */
  defaultExpanded?: string[]
  /** Called when a branch opens or closes. */
  onExpandedChange?: (expanded: string[]) => void
  /**
   * Disables every item.
   * @default false
   */
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
  /** The item's id, used by `value` and `expanded`. Also set as its DOM `id`. */
  value?: string
  /**
   * Disables the item.
   * @default false
   */
  disabled?: boolean
  /**
   * Treat the item as a branch without a Group child.
   * @default false
   */
  isBranch?: boolean
  /** Text used for typeahead instead of the item's content. */
  textValue?: string
}

export type TreeGroupProps = PrimitiveProps<'div'>

export type TreeExpanderProps = PrimitiveProps<'button'> & {
  /**
   * Replaces the default chevron icon.
   * @default a chevron icon
   */
  children?: React.ReactNode
  /**
   * Accessible name. Defaults follow the branch state.
   * @default 'Expand' or 'Collapse'
   */
  'aria-label'?: string
  expanded?: boolean
  onToggle?: () => void
  itemId?: string
}
