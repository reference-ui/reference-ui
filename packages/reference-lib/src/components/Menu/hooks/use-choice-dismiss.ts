/**
 * Choice-item dismissal: tree dismiss plus focus restore shared by
 * checkbox, radio, and link items. Takes nothing, returns the
 * dismiss callback. Levels dismiss through the tree; the rare
 * level-less item falls back to its bare Overlay.
 */
import * as React from 'react'
import { useOverlay } from '../../Overlay'
import { useMenuLevel } from '../context'
import { rootTriggerOf } from '../levels/registry'
import { restoreFocusToTrigger } from '../focus/restore'

export function useChoiceDismiss() {
  const overlay = useOverlay()
  const level = useMenuLevel()
  return React.useCallback(() => {
    if (level) {
      level.requestTreeDismiss()
      restoreFocusToTrigger(rootTriggerOf(level))
      return
    }
    if (overlay) {
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }, [level, overlay])
}
