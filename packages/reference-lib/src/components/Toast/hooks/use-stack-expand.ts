/**
 * Toast stack-expand hook: hovers a collapsed stack open and settles it
 * shut shortly after the pointer leaves. A forced expand prop pins the
 * stack open; an in-flight drag holds it while the pointer is down.
 * Returns the expansion state, the hover handlers, and the drag latch
 * items report through.
 */
import * as React from 'react'

export function useStackExpand({ expand = false }: { expand?: boolean }) {
  const [hovered, setIsHovered] = React.useState(false)
  const isExpanded = expand || hovered
  const isInteractingRef = React.useRef(false)
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (expand) return
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (expand || isInteractingRef.current) return
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 80)
  }

  const setInteracting = (dragging: boolean) => {
    isInteractingRef.current = dragging
  }

  return { isExpanded, handleMouseEnter, handleMouseLeave, setInteracting }
}
