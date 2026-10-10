/**
 * Toast swipe hook: the pointer-driven dismiss gesture. Press starts a
 * potential drag (skipping interactive descendants and text selections),
 * moves paint damped offsets along the locked axis, and release either
 * flings the card out past the distance-or-velocity threshold or springs
 * it home. Window-level listeners catch releases outside the window that
 * would otherwise strand a drag; every render refreshes the metadata ref
 * so in-flight gestures read current dismissibility.
 */
import * as React from 'react'
import {
  defaultSwipeDirections,
  hasTextSelection,
  isAllowedSwipe,
  LIBRARY_TOAST_POSITION,
  shouldDismissSwipe,
  swipeOffset,
  type ToastSwipeDirection,
} from '../toastQueue'
import { isReleasedMouseMove } from '../shared/pointer'
import type { ToastDismissReason } from '../types'

export function useSwipe({
  nodeRef,
  id,
  position,
  exiting,
  dismissible,
  swipeLocked,
  itemSwipeDirections,
  hostSwipeDirections,
  dir,
  onDismiss,
  onDragStateChange,
}: {
  nodeRef: React.RefObject<HTMLDivElement | null>
  id: string
  position: string | undefined
  exiting: boolean | undefined
  dismissible: boolean
  swipeLocked: boolean
  itemSwipeDirections: readonly string[] | undefined
  hostSwipeDirections: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'> | undefined
  dir: 'ltr' | 'rtl'
  onDismiss: (id: string, reason: ToastDismissReason) => void
  onDragStateChange: (dragging: boolean) => void
}) {
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [swipeOut, setSwipeOut] = React.useState(false)
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const dragStartTimeRef = React.useRef<number | null>(null)
  const swipeAxisRef = React.useRef<'x' | 'y' | null>(null)
  const draggingRef = React.useRef(false)
  const pointerIdRef = React.useRef<number | null>(null)
  const appliedOffsetRef = React.useRef({ x: 0, y: 0 })
  const allowedSwipe: ReadonlyArray<ToastSwipeDirection> = itemSwipeDirections?.length
    ? (itemSwipeDirections as Array<'top' | 'right' | 'bottom' | 'left'>)
    : hostSwipeDirections?.length
      ? hostSwipeDirections
      : defaultSwipeDirections(position ?? LIBRARY_TOAST_POSITION, dir)
  const swipeMetaRef = React.useRef({
    allowedSwipe,
    dismissible,
    swipeLocked,
    onDismiss,
    id,
    onDragStateChange,
  })
  swipeMetaRef.current = {
    allowedSwipe,
    dismissible,
    swipeLocked,
    onDismiss,
    id,
    onDragStateChange,
  }

  const finishDrag = React.useCallback((pointerId?: number) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    swipeMetaRef.current.onDragStateChange(false)
    const node = nodeRef.current
    try {
      if (node && pointerId != null && node.hasPointerCapture(pointerId)) {
        node.releasePointerCapture(pointerId)
      }
    } catch {
      // ignore
    }
    pointerIdRef.current = null

    const meta = swipeMetaRef.current
    const axis = swipeAxisRef.current ?? 'x'
    const fromNodeX = node ? parseFloat(node.style.getPropertyValue('--reference-toast-swipe-x')) || 0 : 0
    const fromNodeY = node ? parseFloat(node.style.getPropertyValue('--reference-toast-swipe-y')) || 0 : 0
    const applied = appliedOffsetRef.current
    const raw = axis === 'y' ? (applied.y || fromNodeY) : (applied.x || fromNodeX)
    const distance = Math.abs(raw)
    const time = dragStartTimeRef.current ? Date.now() - dragStartTimeRef.current : 1
    const velocity = distance / Math.max(1, time)
    const allowed = isAllowedSwipe(axis, raw, meta.allowedSwipe)

    if (meta.dismissible && !meta.swipeLocked && allowed && shouldDismissSwipe(distance, velocity)) {
      const exit = axis === 'y' ? { x: 0, y: raw > 0 ? 280 : -280 } : { x: raw > 0 ? 400 : -400, y: 0 }
      setSwipeOut(true)
      setDragOffset(exit)
      node?.style.setProperty('--reference-toast-swipe-x', `${exit.x}px`)
      node?.style.setProperty('--reference-toast-swipe-y', `${exit.y}px`)
      meta.onDismiss(meta.id, 'manual')
    } else {
      setDragOffset({ x: 0, y: 0 })
      node?.style.setProperty('--reference-toast-swipe-x', '0px')
      node?.style.setProperty('--reference-toast-swipe-y', '0px')
    }
    appliedOffsetRef.current = { x: 0, y: 0 }
    dragStartRef.current = null
    dragStartTimeRef.current = null
    swipeAxisRef.current = null
  }, [nodeRef])

  const applyDragDelta = React.useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current || !dragStartRef.current) return
    const xDelta = clientX - dragStartRef.current.x
    const yDelta = clientY - dragStartRef.current.y
    if (!swipeAxisRef.current && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      swipeAxisRef.current = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }
    const axis = swipeAxisRef.current ?? 'x'
    const amount = axis === 'y' ? yDelta : xDelta
    const next = swipeOffset(axis, amount, swipeMetaRef.current.allowedSwipe)
    appliedOffsetRef.current = next
    const node = nodeRef.current
    node?.style.setProperty('--reference-toast-swipe-x', `${next.x}px`)
    node?.style.setProperty('--reference-toast-swipe-y', `${next.y}px`)
    setDragOffset(next)
  }, [nodeRef])

  React.useEffect(() => {
    const onMove = (e: PointerEvent | MouseEvent) => {
      if (draggingRef.current && isReleasedMouseMove(e)) {
        // Release outside the window: Firefox reports the out-of-window
        // position with no buttons held and drops the up event, so finish
        // from the last applied offset instead of tracking the phantom.
        finishDrag()
        return
      }
      applyDragDelta(e.clientX, e.clientY)
    }
    const onUp = (e: Event) => {
      const pointerId = 'pointerId' in e ? (e as PointerEvent).pointerId : undefined
      finishDrag(pointerId)
    }
    const opts: AddEventListenerOptions = { capture: true }
    window.addEventListener('pointermove', onMove, opts)
    window.addEventListener('mousemove', onMove, opts)
    window.addEventListener('pointerup', onUp, opts)
    window.addEventListener('mouseup', onUp, opts)
    return () => {
      window.removeEventListener('pointermove', onMove, opts)
      window.removeEventListener('mousemove', onMove, opts)
      window.removeEventListener('pointerup', onUp, opts)
      window.removeEventListener('mouseup', onUp, opts)
    }
  }, [applyDragDelta, finishDrag])

  const startDrag = (clientX: number, clientY: number, pointerId: number | null, currentTarget: HTMLDivElement, target: EventTarget | null) => {
    if (swipeMetaRef.current.swipeLocked || exiting) return
    const el = target instanceof Element ? target : null
    if (el?.closest('[data-reference-toast-close], [data-reference-toast-action], [data-reference-toast-cancel], a, input, textarea, select, [contenteditable="true"]')) {
      return
    }
    const doc = currentTarget.ownerDocument
    const selection = doc.getSelection?.() ?? (typeof window !== 'undefined' ? window.getSelection() : null)
    if (selection && selection.toString().length > 0 && selection.anchorNode && !currentTarget.contains(selection.anchorNode)) {
      selection.removeAllRanges()
    }
    if (hasTextSelection(doc, currentTarget)) return

    draggingRef.current = true
    pointerIdRef.current = pointerId
    dragStartRef.current = { x: clientX, y: clientY }
    dragStartTimeRef.current = Date.now()
    swipeAxisRef.current = null
    appliedOffsetRef.current = { x: 0, y: 0 }
    setIsDragging(true)
    onDragStateChange(true)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    startDrag(e.clientX, e.clientY, e.pointerId, e.currentTarget, e.target)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (draggingRef.current) return
    startDrag(e.clientX, e.clientY, null, e.currentTarget, e.target)
  }

  return {
    dragOffset,
    isDragging,
    swipeOut,
    handlePointerDown,
    handleMouseDown,
    applyDragDelta,
    finishDrag,
  }
}
