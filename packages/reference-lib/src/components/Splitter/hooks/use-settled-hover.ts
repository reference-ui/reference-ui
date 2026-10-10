/**
 * useSettledHover: recomputes a Handle's hover flag from the release
 * position once its drag settles. Hover may go stale while captured
 * (leave is suppressed mid-drag), so the release pointerup/pointercancel
 * re-tests the pointer against the handle rect instead of trusting it.
 */
import * as React from 'react'

export function useSettledHover(
  handleRef: React.RefObject<HTMLDivElement | null>,
  isDragging: boolean,
  setIsHovered: (hovered: boolean) => void
): void {
  // Hover may go stale while captured (leave is suppressed mid-drag), so
  // recompute it from the release position once the session settles.
  React.useEffect(() => {
    if (!isDragging) return
    const recomputeHover = (e: PointerEvent) => {
      const rect = handleRef.current?.getBoundingClientRect()
      if (!rect) {
        setIsHovered(false)
        return
      }
      setIsHovered(
        e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
      )
    }
    window.addEventListener('pointerup', recomputeHover)
    window.addEventListener('pointercancel', recomputeHover)
    return () => {
      window.removeEventListener('pointerup', recomputeHover)
      window.removeEventListener('pointercancel', recomputeHover)
    }
  }, [isDragging, handleRef, setIsHovered])
}
