/**
 * Right-button outside path: pointerdown dismiss ignores non-primary
 * presses, so an outside contextmenu is the tree's close signal while
 * native context behavior remains available — never prevented,
 * capture so a stopping target still closes. Takes the open flag,
 * content ref, and level value; inside presses stay open.
 */
import * as React from 'react'
import { isEventInside } from '../../Overlay'
import type { MenuLevelValue } from '../context'

export function useContextMenuDismiss({ isOpen, menuRef, levelValue }: {
  isOpen: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  levelValue: MenuLevelValue
}) {
  // Right-button outside path. Pointerdown dismiss ignores non-primary
  // presses, so an outside contextmenu is the tree's close signal (MN-COMP-02:
  // outside dismissal occurs once while native context behavior remains
  // available — never prevented, capture so a stopping target still closes).
  // Inside presses (content, triggers, submenu branches) stay open.
  const { getTrigger, registry, requestTreeDismiss } = levelValue
  React.useEffect(() => {
    if (!isOpen) return
    const doc =
      menuRef.current?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    const onMenu = (event: MouseEvent) => {
      const inTree =
        isEventInside(menuRef.current, event) ||
        isEventInside(getTrigger(), event) ||
        [...registry.values()].some(
          reg => isEventInside(reg.getTrigger(), event) || isEventInside(reg.getContent(), event)
        )
      if (inTree) return
      requestTreeDismiss()
    }
    doc.addEventListener('contextmenu', onMenu, true)
    return () => doc.removeEventListener('contextmenu', onMenu, true)
  }, [isOpen, requestTreeDismiss])
}
