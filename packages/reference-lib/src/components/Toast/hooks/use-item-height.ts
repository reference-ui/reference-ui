/**
 * Toast item-height hook: measures the card's content height and reports
 * it upward so the stack can space expanded toasts by real geometry. A
 * ResizeObserver keeps the reading live across content swaps while the
 * zero guard ignores pre-layout frames.
 */
import * as React from 'react'
import type { ToastItem } from '../types'

export function useItemHeight({
  nodeRef,
  item,
  onHeight,
}: {
  nodeRef: React.RefObject<HTMLDivElement | null>
  item: ToastItem
  onHeight: (id: string, height: number) => void
}) {
  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const measure = () => {
      const inner = node.querySelector('[data-reference-toast-root]') as HTMLElement | null
      const h = (inner ?? node).scrollHeight || (inner ?? node).getBoundingClientRect().height
      if (h > 0) onHeight(item.id, h)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [item.id, onHeight, item.content, item.title, item.description, item.action, item.cancel, nodeRef])
}
