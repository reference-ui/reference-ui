/**
 * Root close restore: when the menu closes with focus still inside,
 * return it to the trigger. Takes the open flag, content ref, and
 * overlay; runs every commit comparing against the previous open
 * state so the close edge is caught without depending on it.
 */
import * as React from 'react'
import { useOverlay } from '../../Overlay'
import { activeElementIn } from '../focus/scope'
import { restoreFocusToTrigger } from '../focus/restore'

export function useCloseRestore({ isOpen, menuRef, overlay }: {
  isOpen: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  overlay: ReturnType<typeof useOverlay>
}) {
const wasOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!wasOpen || isOpen) return
    if (menuRef.current?.contains(activeElementIn(menuRef.current))) {
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
  })
}
