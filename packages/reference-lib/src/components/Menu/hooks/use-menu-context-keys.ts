/**
 * Keyboard and context-entry wiring for a ContextMenu target opening
 * a root Menu from a context press, the ContextMenu key, or Shift+F10.
 * Takes nothing, returns handlers to spread on the target. Plants
 * unconditionally: contextmenu preventDefault suppresses the native
 * menu, so it can never double as entry cancellation.
 */
import * as React from 'react'
import { setMenuEntryIntent } from '../levels/entry'
import type { MenuContextKeys } from '../types'

// Keyboard/context-entry wiring for a ContextMenu target that opens a root
// Menu from a context press, the ContextMenu key, or Shift+F10. Spread the
// result onto the target; the gesture must open the menu (controlled open +
// virtual anchor), otherwise the plant leaks into the next unrelated open.
// Plants unconditionally: contextmenu preventDefault suppresses the native
// menu, so it can never double as entry cancellation the way a trigger
// preventDefault does. Chaining order against consumer handlers is free.
export function useMenuContextKeys(): MenuContextKeys {
  const onContextMenu = React.useCallback((_e: React.MouseEvent<HTMLElement>) => {
    setMenuEntryIntent('first')
  }, [])

  const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && (e.key === 'F10' || e.key === 'f10'))) {
      setMenuEntryIntent('first')
    }
  }, [])

  return React.useMemo(() => ({ onContextMenu, onKeyDown }), [onContextMenu, onKeyDown])
}
