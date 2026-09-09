import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { Portal } from '../../Portal'
import { Presence } from '../../Presence'
import { FocusLock } from '../../FocusLock'
import { OverlayContext } from '../context'
import {
  overlayStackStore,
  descendantsDeepestFirst,
  useOverlayZIndex,
  useLayerPointerEvents,
  useOverlayStore,
} from '../stack'
import { useComposedRef } from '../shared/refs'
import { usePreventScroll } from '../isolation/scroll-lock'
import { useHideOutside } from '../isolation/hide-outside'
import { usePointerLock } from '../isolation/pointer-events'
import { useOverlayPosition } from '../geometry/use-position'
import type { OverlayContentGeometry } from '../types'
import { nextAfter, tabbables } from './tab-cycle'

export type OverlayContentProps = PrimitiveProps<'div'> & OverlayContentGeometry

export function OverlayContent({
  children,
  placement = 'bottom-start',
  offset = 8,
  collisionPadding = 8,
  strategy = 'absolute',
  flip = true,
  shift = true,
  initialFocus,
  restoreFocus,
  style,
  className,
  ...props
}: OverlayContentProps) {
  const context = React.useContext(OverlayContext)
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const zIndex = useOverlayZIndex(context?.id ?? '')
  const userRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref
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

  const childLayerKey = useOverlayStore(state => {
    if (!context?.id) return ''
    return descendantsDeepestFirst(state.layers, context.id)
      .map(l => `${l.id}:${l.node ? 1 : 0}`)
      .join(',')
  })

  const shards = React.useMemo(() => {
    if (!context) return []
    return descendantsDeepestFirst(overlayStackStore.getState().layers, context.id)
      .map(l => l.node)
      .filter((n): n is HTMLElement => n !== null)
  }, [context, childLayerKey])

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

  React.useEffect(() => {
    if (!context || isolation?.focus || !isOpen || !node) return
    const trigger = context.triggerRef.current
    if (!trigger) return
    const doc = node.ownerDocument
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return
      const items = tabbables(node)
      if (items.length === 0) return
      const active = doc.activeElement
      const first = items[0]
      const last = items[items.length - 1]
      if (!e.shiftKey && (active === trigger || trigger.contains(active))) {
        e.preventDefault()
        first?.focus()
        return
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault()
        context.setIsOpen(false)
        nextAfter(trigger, node)?.focus()
      }
      if (e.shiftKey && active === first) {
        e.preventDefault()
        trigger.focus()
      }
    }
    doc.addEventListener('keydown', onKeyDown)
    return () => doc.removeEventListener('keydown', onKeyDown)
  }, [context, isolation?.focus, isOpen, node])

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

  return <Portal container={context.portalContainer}>{presentable}</Portal>
}
