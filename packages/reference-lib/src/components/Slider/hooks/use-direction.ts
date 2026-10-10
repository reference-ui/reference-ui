/**
 * useDirection: the slider's inherited reading direction. An explicit dir
 * ancestor wins, otherwise the computed direction (which also crosses
 * ShadowRoot boundaries). Re-read after every render so React-driven dir
 * switches apply immediately.
 */
import * as React from 'react'

export function useDirection(rootRef: React.RefObject<HTMLDivElement | null>): boolean {
  const [isRtl, setIsRtl] = React.useState(false)
  React.useLayoutEffect(() => {
    const rootNode = rootRef.current
    if (!rootNode) return
    const dirAttr = rootNode.closest('[dir]')?.getAttribute('dir')
    if (dirAttr) {
      setIsRtl(dirAttr.toLowerCase() === 'rtl')
    } else if (typeof window !== 'undefined') {
      const computed = window.getComputedStyle(rootNode).direction
      setIsRtl(computed === 'rtl')
    }
  })
  return isRtl
}
