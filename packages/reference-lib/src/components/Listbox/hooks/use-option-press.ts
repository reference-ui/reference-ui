/**
 * Listbox option press handling: primary-button pointer/mouse down
 * selects at press time when the consumer attached no onClick
 * (LB-POINTER-01), click commits when press did not, and disabled
 * options are strictly inert — no consumer activation, defaults
 * suppressed so the press cannot start a focus/selection path
 * (LB-DOM-04, LB-POINTER-04). Portaled row content and interactive
 * descendants are never option presses (B-02).
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import { isInteractiveDescendant } from '../shared/interactive'
import type { ListboxContextValue } from '../types'

export interface OptionPressHandlers {
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handlePointerEnter: (e: React.PointerEvent<HTMLDivElement>) => void
  handleClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

export interface OptionPress {
  context: ListboxContextValue | null
  combobox: ComboboxContextValue | null
  value: string
  isDisabled: boolean
  onClick: React.MouseEventHandler<HTMLDivElement> | undefined
  onPointerDown: React.PointerEventHandler<HTMLDivElement> | undefined
  onMouseDown: React.MouseEventHandler<HTMLDivElement> | undefined
  onPointerEnter: React.PointerEventHandler<HTMLDivElement> | undefined
}

export function useOptionPress({
  context,
  combobox,
  value,
  isDisabled,
  onClick,
  onPointerDown,
  onMouseDown,
  onPointerEnter,
}: OptionPress): OptionPressHandlers {
  const hasTriggeredPressRef = React.useRef(false)

  const handlePressStart = (e: React.SyntheticEvent<HTMLDivElement>) => {
    if (isDisabled) return
    // B-02: presses from portaled row content (Menu/Popover React-tree
    // children) or interactive in-row content (button/input/...) are not
    // option presses — same guard family as keydown below.
    if (!e.currentTarget.contains(e.target as Node)) return
    if (isInteractiveDescendant(e.target, e.currentTarget)) return
    if (combobox) {
      e.preventDefault()
      return
    }

    // LB-POINTER-01: Select at primary press down when no custom onClick handler is attached
    if (!onClick && !hasTriggeredPressRef.current) {
      hasTriggeredPressRef.current = true
      context?.selectOption(value)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // LB-DOM-04 / LB-POINTER-04: disabled options are strictly inert — no
    // consumer activation, and the default (compatibility mouse events) is
    // suppressed so the press cannot start a focus/selection path.
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onPointerDown?.(e)
    if (e.defaultPrevented) return
    if (e.button === 0 || e.pointerType === 'touch') {
      handlePressStart(e)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // LB-DOM-04: suppress the mousedown default so a pointer press on a
    // disabled option cannot move DOM focus to it (native disabled parity).
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onMouseDown?.(e)
    if (e.defaultPrevented) return
    if (e.button === 0) {
      handlePressStart(e)
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (!isDisabled && combobox) {
      combobox.setActiveValue(value)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // LB-POINTER-04: a disabled option never runs consumer activation.
    if (isDisabled) {
      hasTriggeredPressRef.current = false
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) {
      hasTriggeredPressRef.current = false
      return
    }
    // B-02: clicks from portaled row content bubble through the React tree
    // into this handler — without a DOM-containment check every menu action
    // re-toggles the row. In-row interactive content (a ⋯ Menu trigger)
    // must not select either.
    if (!e.currentTarget.contains(e.target as Node)) {
      hasTriggeredPressRef.current = false
      return
    }
    if (isInteractiveDescendant(e.target, e.currentTarget)) {
      hasTriggeredPressRef.current = false
      return
    }

    if (combobox) {
      combobox.handleSelect(value)
      return
    }

    if (hasTriggeredPressRef.current) {
      hasTriggeredPressRef.current = false
      return
    }

    context?.selectOption(value)
  }

  return { handlePointerDown, handleMouseDown, handlePointerEnter, handleClick }
}
