import * as React from 'react'
import type { OverlayAnchor, OverlayEdge } from '../types'
import { overlayStackStore } from '../stack'
import {
  autoUpdate,
  computePosition,
  type Placement,
  type Strategy,
} from './floating'
import { resolveReference } from './reference'
import { bindEdge, publishEdgeStack, clearGeometry } from './edge'

type Options = {
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
  strategy,
  flip,
  shift,
  mixedGeometry,
}: Options) {
  const lastPlacementRef = React.useRef<Placement | undefined>(undefined)

  React.useEffect(() => {
    if (!isOpen) lastPlacementRef.current = undefined
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

    const update = () => {
      const floating = content
      if (!floating) return
      const res = computePosition(reference, floating, {
        placement,
        previousPlacement: lastPlacementRef.current,
        strategy,
        offset,
        collisionPadding,
        flip,
        shift,
        arrow: { element: arrow },
      })
      lastPlacementRef.current = res.placement

      floating.style.position = res.strategy
      floating.style.left = `${res.x}px`
      floating.style.top = `${res.y}px`

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

      floating.setAttribute('data-side', res.placement.split('-')[0] ?? '')
      floating.setAttribute('data-align', res.placement.split('-')[1] || 'center')

      if (res.middlewareData.hide?.referenceHidden) {
        floating.setAttribute('data-anchor-hidden', '')
      } else {
        floating.removeAttribute('data-anchor-hidden')
      }
      if (res.middlewareData.hide?.escaped) {
        floating.setAttribute('data-escaped', '')
      } else {
        floating.removeAttribute('data-escaped')
      }

      if (res.middlewareData.arrow && arrow) {
        const { x: arrowX, y: arrowY } = res.middlewareData.arrow
        if (arrowX !== undefined) arrow.style.left = `${arrowX}px`
        if (arrowY !== undefined) arrow.style.top = `${arrowY}px`
      }
    }

    return autoUpdate(reference, content, update, {
      closeOnScroll,
      onScrollClose: () => setIsOpen(false),
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
