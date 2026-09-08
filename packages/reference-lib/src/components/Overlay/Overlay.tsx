import * as React from 'react'
import type { PortalProps } from '../Portal'
import { OverlayContext, useOverlay } from './context'
import { resolveIsolation, type OverlayProps } from './types'
import { OverlayTrigger } from './parts/Trigger'
import { OverlayPortal } from './parts/Portal'
import { OverlayBackdrop } from './parts/Backdrop'
import { OverlayContent } from './parts/Content'
import { OverlayArrow } from './parts/Arrow'
import { OverlayHandle } from './parts/Handle'
import { PresenceCoordinatorContext, usePresenceCoordinator } from '../Presence'
import { useOverlayOpenState } from './use-open-state'
import { usePartRegistry } from './use-part-registry'
import { useOverlayLayer } from './use-overlay-layer'

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
  OverlayAnchor,
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

/**
 * Overlay root: open state, part registry, stack registration, context.
 * Geometry, isolation, and dismiss live beside this file; the root only assembles them.
 */
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
  const { isOpen, setIsOpen } = useOverlayOpenState({
    open: openProp,
    defaultOpen,
    onOpen,
    onOpenChange,
    onDismiss,
  })
  const presenceCoordinator = usePresenceCoordinator(isOpen)

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const arrowRef = React.useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = React.useState<
    PortalProps['container'] | undefined
  >(undefined)

  const isolation = React.useMemo(() => resolveIsolation(isolationProp), [isolationProp])
  const mixedGeometry = Boolean(edge && anchor)
  const { registeredParts, isCorrupted, setIsCorrupted, registerPart } = usePartRegistry(
    edge,
    mixedGeometry
  )

  useOverlayLayer({
    overlayId,
    parentId: parent?.id ?? null,
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
  })

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
