/**
 * Keyboard-entry wiring for a Popover.Trigger opening a root Menu.
 * Takes nothing, returns key and click handlers to spread on the
 * trigger. Entry intent is recorded only by a press that opens — a
 * press on an already-open trigger plants nothing — while pointer
 * opening focuses the menu itself, never an item.
 */
import * as React from 'react'
import { useOverlay } from '../../Overlay'
import { setMenuEntryIntent } from '../levels/entry'

// Keyboard-entry wiring for a Popover.Trigger that opens a root Menu.
// Spread the result onto the trigger; chain consumer handlers first so a
// consumer preventDefault still wins.
export function useMenuTriggerKeys() {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.defaultPrevented || !overlay) return
      // Entry intent is recorded only by a press that opens. A press on an
      // already-open trigger opens nothing, so it must plant nothing: the
      // cell has no owner and any later open would consume the stale intent.
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!isOpen) setMenuEntryIntent('first')
        overlay.setIsOpen(true)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen) setMenuEntryIntent('last')
        overlay.setIsOpen(true)
      }
    },
    [overlay, isOpen]
  )

  const onClick = React.useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
    // Pointer opening focuses the menu itself, never an item. Keyboard
    // Enter/Space never reach here: the keydown above prevents activation.
    setMenuEntryIntent(null)
  }, [])

  return React.useMemo(() => ({ onKeyDown, onClick }), [onKeyDown, onClick])
}
