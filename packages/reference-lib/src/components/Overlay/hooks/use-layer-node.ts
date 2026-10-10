/**
 * Publishes Content's node to its document-stack layer while mounted.
 * Presence keeps Content alive through exit, so the layer drops only when
 * already closed — letting scroll lock, inert, and focus release exactly
 * once. Used only by `parts/Content`.
 */
import * as React from 'react'
import type { OverlayContextValue } from '../context'
import { overlayStackStore } from '../stack'

export function useLayerNode(context: OverlayContextValue | null, node: HTMLDivElement | null) {
  React.useLayoutEffect(() => {
    if (!context || !node) return
    overlayStackStore.getState().setLayerNode(context.id, node)
    return () => {
      // Presence keeps Content mounted through exit. Drop the stack node on
      // unmount; if the layer is already closed, remove it so isolation releases.
      overlayStackStore.getState().setLayerNode(context.id, null)
      const current = overlayStackStore.getState().layers.find(l => l.id === context.id)
      if (current && !current.open) overlayStackStore.getState().removeLayer(context.id)
    }
  }, [context, node])
}
