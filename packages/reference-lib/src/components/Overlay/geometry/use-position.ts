import * as React from 'react'
import type { OverlayAnchor, OverlayEdge } from '../types'
import { overlayStackStore } from '../stack'
import {
  autoUpdate,
  computePosition,
  type Placement,
  type Strategy,
  type VirtualAnchor,
  type Side,
} from './floating'
import { resolveReference } from './reference'
import { bindEdge, publishEdgeStack, clearGeometry } from './edge'

type PositionOptions = {
  isOpen: boolean
  setIsOpen?: (open: boolean) => void
  anchor?: OverlayAnchor
  edge?: OverlayEdge
  isolationFocus: boolean
  closeOnScroll?: boolean
  content: HTMLDivElement | null
  trigger: HTMLElement | null
  arrow: HTMLDivElement | null
  placement: Placement
  offset: number
  collisionPadding: number
  boundary?: HTMLElement | VirtualAnchor | React.RefObject<HTMLElement | null> | 'viewport' | null
  fallbackPlacements?: Placement[]
  animationFrame?: boolean
  onPositionChange?: (data: {
    placement: Placement
    side: import('./floating').Side
    align: string
    nudgedLeft: number
    nudgedTop: number
  }) => void
  strategy: Strategy
  flip: boolean
  shift: boolean
  mixedGeometry: boolean
}

export function useOverlayPosition({
  isOpen,
  setIsOpen,
  anchor,
  edge,
  isolationFocus,
  closeOnScroll,
  content,
  trigger,
  arrow,
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
  mixedGeometry,
}: PositionOptions) {
  const lastPlacementRef = React.useRef<Placement | undefined>(undefined)
  const lastPublishedRef = React.useRef<{
    placement: Placement
    side: string
    align: string
    nudgedX: number
    nudgedY: number
    hidden: boolean
    escaped: boolean
  } | null>(null)

  React.useEffect(() => {
    if (!isOpen) {
      lastPlacementRef.current = undefined
      lastPublishedRef.current = null
    }
  }, [isOpen])

  React.useLayoutEffect(() => {
    if (!isOpen || !content || !setIsOpen) return
    if (mixedGeometry) return

    if (edge) {
      bindEdge(content, edge, offset)
      const doc = content.ownerDocument
      const live = overlayStackStore
        .getState()
        .layers.filter(l => l.edge && (l.node?.ownerDocument === doc || l.document === doc))
      const idx = live.findIndex(l => l.node === content)
      const fromTop = idx === -1 ? 0 : live.length - 1 - idx
      publishEdgeStack(content, fromTop, live.length)
      return
    }

    const reference = resolveReference(anchor ?? null, trigger, isolationFocus, edge)
    if (!reference) {
      // Unbound dialog: omitted isolation plus Trigger writes no coordinates.
      return
    }

    const resolvedBoundary =
      boundary && typeof boundary === 'object' && 'current' in boundary
        ? (boundary as React.RefObject<HTMLElement | null>).current
        : (boundary as HTMLElement | VirtualAnchor | 'viewport' | null | undefined)

    const update = () => {
      const floating = content
      if (!floating) return
      const res = computePosition(reference, floating, {
        placement,
        previousPlacement: lastPlacementRef.current,
        strategy,
        offset,
        collisionPadding,
        boundary: resolvedBoundary,
        fallbackPlacements,
        flip,
        shift,
        arrow: { element: arrow },
      })
      lastPlacementRef.current = res.placement

      const left = `${res.x}px`
      const top = `${res.y}px`
      if (floating.style.position !== res.strategy) floating.style.position = res.strategy
      if (floating.style.left !== left) floating.style.left = left
      if (floating.style.top !== top) floating.style.top = top

      if (res.middlewareData.size) {
        floating.style.setProperty(
          '--reference-overlay-available-width',
          `${res.middlewareData.size.availableWidth}px`
        )
        floating.style.setProperty(
          '--reference-overlay-available-height',
          `${res.middlewareData.size.availableHeight}px`
        )
        floating.style.setProperty(
          '--reference-overlay-anchor-width',
          `${res.middlewareData.size.anchorWidth}px`
        )
        floating.style.setProperty(
          '--reference-overlay-anchor-height',
          `${res.middlewareData.size.anchorHeight}px`
        )
      }

      const side = res.placement.split('-')[0] ?? ''
      const align = res.placement.split('-')[1] || 'center'
      const nudgedX = res.middlewareData.shift?.x ?? 0
      const nudgedY = res.middlewareData.shift?.y ?? 0
      const hidden = Boolean(res.middlewareData.hide?.referenceHidden)
      const escaped = Boolean(res.middlewareData.hide?.escaped)
      const prev = lastPublishedRef.current
      const attrsChanged =
        !prev ||
        prev.placement !== res.placement ||
        prev.side !== side ||
        prev.align !== align ||
        prev.nudgedX !== nudgedX ||
        prev.nudgedY !== nudgedY ||
        prev.hidden !== hidden ||
        prev.escaped !== escaped

      if (attrsChanged) {
        floating.setAttribute('data-side', side)
        floating.setAttribute('data-align', align)
        floating.setAttribute('data-nudged-x', nudgedX.toFixed(2))
        floating.setAttribute('data-nudged-y', nudgedY.toFixed(2))
        if (hidden) floating.setAttribute('data-anchor-hidden', '')
        else floating.removeAttribute('data-anchor-hidden')
        if (escaped) floating.setAttribute('data-escaped', '')
        else floating.removeAttribute('data-escaped')
        onPositionChange?.({
          placement: res.placement,
          side: side as Side,
          align,
          nudgedLeft: nudgedX,
          nudgedTop: nudgedY,
        })
        lastPublishedRef.current = {
          placement: res.placement,
          side,
          align,
          nudgedX,
          nudgedY,
          hidden,
          escaped,
        }
      }

      floating.style.setProperty('--reference-overlay-nudge-x', `${nudgedX.toFixed(2)}px`)
      floating.style.setProperty('--reference-overlay-nudge-y', `${nudgedY.toFixed(2)}px`)

      if (res.middlewareData.arrow && arrow) {
        const { x: arrowX, y: arrowY } = res.middlewareData.arrow
        if (arrowX !== undefined) arrow.style.left = `${arrowX}px`
        if (arrowY !== undefined) arrow.style.top = `${arrowY}px`
      }
    }

    return autoUpdate(reference, content, update, {
      closeOnScroll,
      onScrollClose: () => setIsOpen(false),
      animationFrame,
      boundary: resolvedBoundary && resolvedBoundary !== 'viewport' ? resolvedBoundary : null,
    })
  }, [
    isOpen,
    setIsOpen,
    anchor,
    edge,
    isolationFocus,
    closeOnScroll,
    content,
    trigger,
    arrow,
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
    mixedGeometry,
  ])

  React.useEffect(() => {
    return () => {
      if (content && !isOpen && (edge || anchor)) clearGeometry(content)
    }
  }, [content, isOpen, edge, anchor])
}
