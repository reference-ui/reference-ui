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
import { PresenceCoordinatorContext, usePresenceCoordinator } from '../Presence'

export {
  OverlayTrigger,
  OverlayPortal,
  OverlayBackdrop,
  OverlayContent,
  OverlayArrow,
  OverlayHandle,
}
export { resolveIsolation } from './types'

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
  const presenceCoordinator = usePresenceCoordinator(isOpen)

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const arrowRef = React.useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = React.useState<
    PortalProps['container'] | undefined
  >(undefined)

  const isolation = React.useMemo(() => resolveIsolation(isolationProp), [isolationProp])
  const mixedGeometry = Boolean(edge && anchor)

  const registeredParts = React.useRef(new Map<string, number>())
  const [isCorrupted, setIsCorrupted] = React.useState(false)

  const registerPart = React.useCallback(
    (name: import('./context').OverlayPartName) => {
      const current = (registeredParts.current.get(name) ?? 0) + 1
      registeredParts.current.set(name, current)
      if (current > 1) {
        overlayWarn(
          `Duplicate Overlay.${name[0].toUpperCase() + name.slice(1)} detected: an Overlay may define at most one ${name} part.`
        )
        setIsCorrupted(true)
      }
      if (name === 'handle' && !edge) {
        overlayWarn('Overlay.Handle requires `edge`.')
        setIsCorrupted(true)
      }
      return () => {
        const next = (registeredParts.current.get(name) ?? 1) - 1
        if (next <= 0) registeredParts.current.delete(name)
        else registeredParts.current.set(name, next)
      }
    },
    [edge]
  )

  React.useEffect(() => {
    if (mixedGeometry) {
      overlayWarn('`edge` and `anchor` are mutually exclusive.')
      setIsCorrupted(true)
    }
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
    isCorrupted,
    overlayId,
    parent?.id,
    isolation,
    edge,
    setIsOpen,
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
      isCorrupted,
      registerPart,
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
      isCorrupted,
      registerPart,
      portalContainer,
      onEscape,
      onOutsidePress,
      onInteractOutside,
      onDismiss,
      onOpen,
    ]
  )

  return (
    <PresenceCoordinatorContext.Provider value={presenceCoordinator}>
      <OverlayContext.Provider value={contextValue}>{children}</OverlayContext.Provider>
    </PresenceCoordinatorContext.Provider>
  )
}

Overlay.Trigger = OverlayTrigger
Overlay.Portal = OverlayPortal
Overlay.Backdrop = OverlayBackdrop
Overlay.Content = OverlayContent
Overlay.Arrow = OverlayArrow
Overlay.Handle = OverlayHandle
