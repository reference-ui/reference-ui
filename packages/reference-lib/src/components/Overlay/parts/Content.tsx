/**
 * The layer's document presence: portals Content, gates it through
 * Presence, wires FocusLock, isolation, and positioning, then composes the
 * wrapper pipeline. Behavior lives in hooks; this file assembles them.
 */
import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { Portal } from '../../Portal'
import { Presence } from '../../Presence'
import { FocusLock } from '../../FocusLock'
import { OverlayContext } from '../context'
import { useOverlayZIndex, useLayerPointerEvents } from '../stack'
import { useChildShards, useLayerNode } from '../hooks'
import { useComposedRef } from '../shared/refs'
import { usePreventScroll } from '../isolation/scroll-lock'
import { useHideOutside } from '../isolation/hide-outside'
import { usePointerLock } from '../isolation/pointer-events'
import { useOverlayPosition } from '../geometry/use-position'
import type { OverlayContentGeometry } from '../types'
import { useTabCycle } from './tab-cycle'
import { resolvePortalContainer } from './portal-container'
export type OverlayContentProps = PrimitiveProps<'div'> & OverlayContentGeometry

export const OverlayContent: React.ForwardRefExoticComponent<
  OverlayContentProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, OverlayContentProps>(
  function OverlayContent(
    {
      children,
      placement = 'bottom-start',
      offset = 8,
      collisionPadding = 8,
      strategy = 'absolute',
      flip = true,
      shift = true,
      boundary,
      fallbackPlacements,
      animationFrame,
      onPositionChange,
      initialFocus,
      restoreFocus,
      style,
      className,
      ...props
    }: OverlayContentProps,
    forwardedRef
  ) {
  const context = React.useContext(OverlayContext)
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const zIndex = useOverlayZIndex(context?.id ?? '')
  // r19 delivers ref as a prop; r17/r18 strip it (no forwardRef = dropped).
  // forwardRef restores delivery on all majors with the same value on r19.
  const propsRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref
  const userRef = forwardedRef ?? propsRef
  const contentNodeRef = context?.contentRef
  const internalNodeRef = React.useCallback((el: HTMLDivElement | null) => {
    if (contentNodeRef) contentNodeRef.current = el
    setNode(el)
  }, [contentNodeRef])
  const composedRef = useComposedRef<HTMLDivElement>(internalNodeRef, userRef)

  React.useLayoutEffect(() => {
    return context?.registerPart('content')
  }, [context])

  const isOpen = context?.isOpen ?? false
  const isolation = context?.isolation

  const shards = useChildShards(context)

  useLayerNode(context, node)

  useOverlayPosition({
    isOpen,
    setIsOpen: context?.setIsOpen,
    anchor: context?.anchor,
    edge: context?.edge,
    isolationFocus: isolation?.focus ?? true,
    closeOnScroll: context?.closeOnScroll,
    content: node,
    trigger: context?.triggerRef.current ?? null,
    arrow: context?.arrowRef.current ?? null,
    placement,
    offset,
    collisionPadding,
    boundary,
    fallbackPlacements,
    animationFrame,
    onPositionChange,
    strategy,
    flip,
    shift,
    mixedGeometry: context?.mixedGeometry ?? false,
  })

  usePreventScroll(
    Boolean(node && isolation?.scroll),
    Boolean(context?.edge && isolation?.scroll),
    node?.ownerDocument
  )
  useHideOutside(node, Boolean(node && isolation?.inert))
  usePointerLock(Boolean(node && isolation?.inert), node?.ownerDocument)

  useTabCycle({ context, node, isOpen, focusIsolated: isolation?.focus })

  const pointerEventsLock = useLayerPointerEvents(context?.id ?? '', node?.ownerDocument)

  if (!context || context.isCorrupted) return null

  const content = (
    <Div
      data-reference-overlay-content=""
      data-state={isOpen ? 'open' : 'closed'}
      className={className}
      style={{
        zIndex,
        ...style,
        ...(pointerEventsLock ? { pointerEvents: pointerEventsLock } : {}),
      }}
      {...props}
      ref={composedRef}
    >
      {children}
    </Div>
  )

  const locked = isolation?.focus ? (
    <FocusLock
      defaultRestoreTarget={context?.triggerRef}
      initialFocus={initialFocus}
      restoreFocus={restoreFocus ?? true}
      shards={shards}
    >
      {content}
    </FocusLock>
  ) : (
    content
  )

  const presentable = context.presence ? (
    <Presence present={isOpen}>{locked}</Presence>
  ) : isOpen ? (
    locked
  ) : null

  return <Portal container={resolvePortalContainer(context)}>{presentable}</Portal>
  }
)
