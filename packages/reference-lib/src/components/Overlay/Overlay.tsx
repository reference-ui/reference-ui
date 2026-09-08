import * as React from 'react'
import type { PortalProps } from '../Portal'
import { overlayStackStore, setLayerHandlers } from './stack'
import { OverlayContext, overlayWarn, useOverlay } from './context'
import { resolveIsolation, type OverlayProps } from './types'
import { OverlayTrigger } from './parts/Trigger'
import { OverlayPortal } from './parts/Portal'
import { OverlayBackdrop } from './parts/Backdrop'
import { OverlayContent } from './parts/Content'
import { OverlayArrow } from './parts/Arrow'
import { OverlayHandle } from './parts/Handle'
import { syncDismissListeners } from './dismiss'

export {
  OverlayTrigger,
  OverlayPortal,
  OverlayBackdrop,
  OverlayContent,
  OverlayArrow,
  OverlayHandle,
}

export type {
  OverlayProps,
  OverlayPlacement,
  OverlayEdge,
  OverlayIsolation,
  OverlayDismissHandlers,
  OverlayPortalProps,
  OverlayContentGeometry,
} from './types'
export type { OverlayTriggerProps } from './parts/Trigger'
export type { OverlayBackdropProps } from './parts/Backdrop'
export type { OverlayContentProps } from './parts/Content'
export type { OverlayArrowProps } from './parts/Arrow'
export type { OverlayHandleProps } from './parts/Handle'
export { useOverlay }

export function Overlay({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  isolation: isolationProp = true,
  anchor,
  edge,
  closeOnScroll = false,
  presence = true,
  onEscape,
  onOutsidePress,
  onInteractOutside,
  onDismiss,
}: OverlayProps) {
  const parent = React.useContext(OverlayContext)
  const overlayId = React.useId()
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const arrowRef = React.useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = React.useState<
    PortalProps['container'] | undefined
  >(undefined)

  const isolation = React.useMemo(() => resolveIsolation(isolationProp), [isolationProp])
  const mixedGeometry = Boolean(edge && anchor)

  React.useEffect(() => {
    if (mixedGeometry) overlayWarn('`edge` and `anchor` are mutually exclusive.')
  }, [mixedGeometry])

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) onOpen?.()
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) onDismiss?.()
    },
    [isControlled, isOpen, onOpen, onOpenChange, onDismiss]
  )

  React.useEffect(() => {
    if (isOpen) {
      overlayStackStore.getState().addLayer({
        id: overlayId,
        parentId: parent?.id ?? null,
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
    overlayId,
    parent?.id,
    isolation,
    edge,
    setIsOpen,
    onEscape,
    onOutsidePress,
    onInteractOutside,
  ])

  React.useEffect(() => {
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

  const contextValue = React.useMemo(
    () => ({
      id: overlayId,
      isOpen,
      setIsOpen,
      isolation,
      anchor,
      edge,
      closeOnScroll,
      presence,
      mixedGeometry,
      portalContainer,
      setPortalContainer,
      contentRef,
      triggerRef,
      arrowRef,
      onEscape,
      onOutsidePress,
      onInteractOutside,
      onDismiss,
      onOpen,
    }),
    [
      overlayId,
      isOpen,
      setIsOpen,
      isolation,
      anchor,
      edge,
      closeOnScroll,
      presence,
      mixedGeometry,
      portalContainer,
      onEscape,
      onOutsidePress,
      onInteractOutside,
      onDismiss,
      onOpen,
    ]
  )

  return <OverlayContext.Provider value={contextValue}>{children}</OverlayContext.Provider>
}

Overlay.Trigger = OverlayTrigger
Overlay.Portal = OverlayPortal
Overlay.Backdrop = OverlayBackdrop
Overlay.Content = OverlayContent
Overlay.Arrow = OverlayArrow
Overlay.Handle = OverlayHandle
