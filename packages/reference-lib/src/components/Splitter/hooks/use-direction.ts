/**
 * useDirection: the group's inherited reading direction, re-read after
 * every render so React-driven dir switches apply immediately, plus a
 * MutationObserver on the nearest [dir] ancestor (or document root) for
 * switches React does not render. updateDir stays callable at pointerdown
 * so the session captures the direction of its own gesture.
 */
import * as React from 'react'
import type { SplitterOrientation } from '../types'
import { readDirection, type SplitterDirection } from '../shared/direction'
import { useIsomorphicLayoutEffect } from '../shared/refs'

export interface Direction {
  isRtl: boolean
  updateDir: () => void
}

export function useDirection(
  containerRef: React.RefObject<HTMLDivElement | null>,
  orientation: SplitterOrientation
): Direction {
  const [dir, setDir] = React.useState<SplitterDirection>('ltr')
  const updateDir = React.useCallback(() => {
    setDir((prev) => {
      const next = readDirection(containerRef.current)
      return prev === next ? prev : next
    })
  }, [containerRef])
  // Re-read every render so React-driven dir switches apply immediately.
  useIsomorphicLayoutEffect(() => {
    updateDir()
  })
  React.useEffect(() => {
    updateDir()
    const root = containerRef.current
    if (!root || typeof MutationObserver === 'undefined') return
    const target =
      root.closest('[dir]') ?? (typeof document !== 'undefined' ? document.documentElement : null)
    if (!target) return
    const observer = new MutationObserver(updateDir)
    observer.observe(target, { attributes: true, attributeFilter: ['dir'] })
    return () => observer.disconnect()
  }, [updateDir, containerRef])
  const isRtl = dir === 'rtl' && orientation === 'horizontal'
  return { isRtl, updateDir }
}
