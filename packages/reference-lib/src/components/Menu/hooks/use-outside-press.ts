/**
 * Menu-owned outside press: Overlay dismisses only its top layer, but
 * a press outside the menu tree must unwind every level deepest-first
 * while a press inside an ancestor keeps it. Takes the open flag,
 * parent level, overlay id, and live trigger read. Capture runs before
 * Overlay's bubble listener; marking consumed pre-empts the single
 * dismiss without preventDefault, preserving native focus and clicks.
 */
import * as React from 'react'
import { isEventConsumed, isPrimaryPointer, markEventConsumed, overlayStackStore } from '../../Overlay'
import { isInsideLayer } from '../../Overlay/dismiss'
import type { MenuLevelValue } from '../context'

export function useOutsidePress({ isOpen, parentLevel, overlayId, getTrigger }: {
  isOpen: boolean
  parentLevel: MenuLevelValue
  overlayId: string | undefined
  getTrigger: () => HTMLElement | null
}) {
  React.useLayoutEffect(() => {
    if (!isOpen) return
    const doc =
      getTrigger()?.ownerDocument ??
      (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    const onDown = (event: PointerEvent) => {
      if (!isPrimaryPointer(event) || isEventConsumed(event)) return
      const layer = overlayId
        ? overlayStackStore.getState().layers.find(l => l.id === overlayId)
        : undefined
      if (!layer || !layer.open) return
      if (isInsideLayer(layer, event)) return
      parentLevel.unwindForPress(event)
      markEventConsumed(event)
    }
    doc.addEventListener('pointerdown', onDown, true)
    return () => doc.removeEventListener('pointerdown', onDown, true)
  }, [isOpen, parentLevel])
}
