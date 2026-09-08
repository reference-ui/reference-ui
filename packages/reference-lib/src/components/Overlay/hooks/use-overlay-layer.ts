import * as React from 'react'
import type { IsolationFlags, OverlayEdge, OverlayProps } from '../types'
import { overlayStackStore, setLayerHandlers } from '../stack'
import { overlayWarn } from '../shared/warn'
import { syncDismissListeners } from '../dismiss'

/** Registers this Overlay on the document stack while open. */

type Options = {
  overlayId: string
  parentId: string | null
  isOpen: boolean
  isCorrupted: boolean
  isolation: IsolationFlags
  edge?: OverlayEdge
  setIsOpen: (open: boolean) => void
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  triggerRef: React.MutableRefObject<HTMLElement | null>
  registeredParts: React.MutableRefObject<Map<string, number>>
  setIsCorrupted: (value: boolean) => void
  onEscape?: OverlayProps['onEscape']
  onOutsidePress?: OverlayProps['onOutsidePress']
  onInteractOutside?: OverlayProps['onInteractOutside']
}

export function useOverlayLayer({
  overlayId,
  parentId,
  isOpen,
  isCorrupted,
  isolation,
  edge,
  setIsOpen,
  contentRef,
  triggerRef,
  registeredParts,
  setIsCorrupted,
  onEscape,
  onOutsidePress,
  onInteractOutside,
}: Options) {
  React.useEffect(() => {
    if (isCorrupted) {
      overlayStackStore.getState().removeLayer(overlayId)
      return
    }

    if (isOpen) {
      if (!contentRef.current && (registeredParts.current.get('content') ?? 0) === 0) {
        overlayWarn('Missing Overlay.Content: an open Overlay requires exactly one Content part.')
        setIsCorrupted(true)
        return
      }

      overlayStackStore.getState().addLayer({
        id: overlayId,
        parentId,
        dismiss: () => setIsOpen(false),
        isolation,
        isModal: isolation.inert,
        open: true,
        edge,
        node: contentRef.current,
        backdrop: null,
        trigger: triggerRef.current,
        document: typeof document !== 'undefined' ? document : null,
      })
      setLayerHandlers(overlayId, {
        dismiss: () => setIsOpen(false),
        onEscape,
        onOutsidePress,
        onInteractOutside,
      })
      syncDismissListeners()
      return
    }

    const live = overlayStackStore.getState().layers.some(l => l.id === overlayId)
    if (!live) return
    overlayStackStore.getState().setLayerOpen(overlayId, false)
    overlayStackStore.getState().cascade(overlayId)
    if (!contentRef.current) {
      overlayStackStore.getState().removeLayer(overlayId)
    }
  }, [
    isOpen,
    isCorrupted,
    overlayId,
    parentId,
    isolation,
    edge,
    setIsOpen,
    contentRef,
    triggerRef,
    registeredParts,
    setIsCorrupted,
    onEscape,
    onOutsidePress,
    onInteractOutside,
  ])

  React.useLayoutEffect(() => {
    setLayerHandlers(overlayId, {
      dismiss: () => setIsOpen(false),
      onEscape,
      onOutsidePress,
      onInteractOutside,
    })
  })

  React.useEffect(() => {
    return () => overlayStackStore.getState().removeLayer(overlayId)
  }, [overlayId])
}
