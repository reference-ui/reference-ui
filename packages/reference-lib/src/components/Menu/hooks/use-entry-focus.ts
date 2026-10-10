/**
 * Trigger-key entry focus, consumed once per open. Takes the open flag
 * and content ref; moves focus to the first or last enabled item for a
 * keyboard entry, or to the menu itself for a pointer entry. The ref
 * (not the module cell) survives StrictMode replay; closing resets
 * for the next open.
 */
import * as React from 'react'
import type { MenuEntryStrategy } from '../types'
import { UNCONSUMED, consumeMenuEntryIntent } from '../levels/entry'
import { ENABLED_MENUITEM_SELECTOR } from '../focus/items'

export function useEntryFocus({ isOpen, menuRef }: {
  isOpen: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
}) {
// Trigger-key entry focus, consumed once per open. The ref (not the module
  // cell) survives StrictMode effect replay; closing resets for the next open.
  const consumedRef = React.useRef<MenuEntryStrategy | typeof UNCONSUMED>(UNCONSUMED)
  React.useEffect(() => {
    if (!isOpen) {
      consumedRef.current = UNCONSUMED
      return
    }
    if (consumedRef.current === UNCONSUMED) {
      consumedRef.current = consumeMenuEntryIntent()
    }
    const strategy = consumedRef.current

    const frameId = requestAnimationFrame(() => {
      if (!menuRef.current) return

      if (strategy === null) {
        menuRef.current.focus({ preventScroll: true })
        return
      }

      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(ENABLED_MENUITEM_SELECTOR)
      )
      if (items.length === 0) return

      const target = strategy === 'last' ? items[items.length - 1] : items[0]
      target?.focus()
    })

    return () => cancelAnimationFrame(frameId)
  }, [isOpen])
}
