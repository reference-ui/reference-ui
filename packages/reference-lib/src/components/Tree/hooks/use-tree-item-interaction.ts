/**
 * Tree item interaction: click commits (button and nested-item clicks
 * belong to their owners), focus promotes the roving tab stop
 * standalone, pointerdown never steals the Combobox source's focus
 * (TR-CB-01), pointer moves preview virtual active (TR-CB-06), and
 * keydown delegates to the root dispatcher after the target, disabled,
 * combobox, and modifier guards.
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import type { TreeContextValue } from '../types'

export interface TreeItemInteractionHandlers {
  handleClick: (e: React.MouseEvent<HTMLDivElement>) => void
  handleFocus: (e: React.FocusEvent<HTMLDivElement>) => void
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export interface TreeItemInteraction {
  tree: TreeContextValue | null
  combobox: ComboboxContextValue | null
  id: string
  isBranch: boolean
  isExpanded: boolean
  isDisabled: boolean
  itemRef: React.RefObject<HTMLDivElement | null>
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement> | undefined
  onFocus: React.FocusEventHandler<HTMLDivElement> | undefined
  onPointerDown: React.PointerEventHandler<HTMLDivElement> | undefined
  onMouseDown: React.MouseEventHandler<HTMLDivElement> | undefined
  onPointerMove: React.PointerEventHandler<HTMLDivElement> | undefined
}

export function useTreeItemInteraction({
  tree,
  combobox,
  id,
  isBranch,
  isExpanded,
  isDisabled,
  itemRef,
  onClick,
  onKeyDown,
  onFocus,
  onPointerDown,
  onMouseDown,
  onPointerMove,
}: TreeItemInteraction): TreeItemInteractionHandlers {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If click originated from a button (e.g. Expander), let it handle without selecting
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    // If click originated inside a nested treeitem, let that child treeitem handle it
    if (target.closest('[role="treeitem"]') !== e.currentTarget) {
      return
    }
    e.stopPropagation()
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && tree) {
      if (combobox) {
        // TR-CB-04: no DOM focus move — the source keeps focus — and the
        // commit routes only through the Combobox root via selectItem.
        tree.selectItem(id)
      } else {
        tree.setFocusedId(id)
        itemRef.current?.focus()
        tree.selectItem(id)
      }
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    onFocus?.(e)
    if (!e.defaultPrevented && !isDisabled && tree && !combobox && tree.focusedId !== id) {
      tree.setFocusedId(id)
    }
  }

  // TR-CB-01: inside Combobox, pointerdown never moves DOM focus off the
  // source (Listbox press parity) — otherwise the input blurs and the
  // popover dismisses before click commits.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (combobox && !e.defaultPrevented) {
      e.preventDefault()
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e)
    if (combobox && !e.defaultPrevented) {
      e.preventDefault()
    }
  }

  // TR-CB-06: pointer preview under virtual focus (Combobox VirtualItem
  // parity: touch excluded, consumer cancellation honored). Branch items
  // wrap their Groups in the DOM, so moves bubbled from a descendant item
  // are ignored — the nearest treeitem owns the preview (same guard family
  // as handleClick; without it the outermost ancestor would win).
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (!combobox || e.defaultPrevented || isDisabled) return
    if (e.pointerType === 'touch') return
    const target = e.target as HTMLElement
    if (target.closest('[role="treeitem"]') !== e.currentTarget) return
    combobox.setActiveValue(id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Editable and interactive descendants keep their own keys (TR-KEY-10)
    if (e.target !== e.currentTarget) return
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || !tree) return

    // TR-CB-01: inside Combobox the source owns all keys (virtual focus) —
    // item roving and typeahead never run, so DOM focus cannot be stolen.
    if (combobox) return

    // Modified keys are not Tree commands (TR-KEY-11)
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return
    }

    tree.handleItemKeyDown(e, id, itemRef.current, isBranch, isExpanded)
  }

  return { handleClick, handleFocus, handlePointerDown, handleMouseDown, handlePointerMove, handleKeyDown }
}
