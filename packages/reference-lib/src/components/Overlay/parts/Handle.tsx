import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { OverlayContext } from '../context'
import { assignRef } from '../shared/refs'
import {
  axisSize,
  dismissDelta,
  sampleVelocity,
  shouldDismiss,
  swipeProgress,
  swipeTransform,
} from '../gesture'

export type OverlayHandleProps = PrimitiveProps<'div'>

export function OverlayHandle({
  style,
  className,
  onPointerDown: userPointerDown,
  ...props
}: OverlayHandleProps) {
  const context = React.useContext(OverlayContext)
  const dragging = React.useRef(false)
  const start = React.useRef({ x: 0, y: 0 })
  const history = React.useRef<Array<{ time: number; x: number; y: number }>>([])
  const userRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref

  React.useLayoutEffect(() => {
    return context?.registerPart('handle')
  }, [context])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    userPointerDown?.(e)
    if (e.defaultPrevented || !context?.edge) return
    dragging.current = true
    start.current = { x: e.clientX, y: e.clientY }
    history.current = [{ time: performance.now(), x: e.clientX, y: e.clientY }]
    e.currentTarget.setPointerCapture(e.pointerId)
    context.contentRef.current?.setAttribute('data-dragging', '')
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const content = context?.contentRef.current
    const edge = context?.edge
    if (!dragging.current || !content || !edge) return

    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const delta = dismissDelta(edge, dx, dy)
    history.current.push({ time: performance.now(), x: e.clientX, y: e.clientY })
    if (history.current.length > 5) history.current.shift()

    const size = axisSize(edge, content.offsetWidth, content.offsetHeight) || 300
    const progress = swipeProgress(delta, size)
    content.style.setProperty('--reference-overlay-swipe-progress', String(progress))
    content.style.transform = swipeTransform(edge, delta)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const content = context?.contentRef.current
    const edge = context?.edge
    if (!dragging.current || !content || !edge) return
    dragging.current = false
    content.removeAttribute('data-dragging')

    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const delta = dismissDelta(edge, dx, dy)
    const size = axisSize(edge, content.offsetWidth, content.offsetHeight) || 300
    const progress = swipeProgress(delta, size)
    const velocity = sampleVelocity(history.current, edge)

    if (shouldDismiss(progress, velocity)) {
      context.setIsOpen(false)
    } else {
      content.style.transform = ''
      content.style.setProperty('--reference-overlay-swipe-progress', '0')
    }
  }

  return (
    <Div
      {...props}
      data-reference-overlay-handle=""
      ref={(node: HTMLDivElement | null) => assignRef(userRef, node)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      width="8r"
      height="1r"
      borderRadius="full"
      bg="colors.gray.400"
      mx="auto"
      my="2r"
      cursor="grab"
      touchAction="none"
      className={className}
      style={style}
    />
  )
}
