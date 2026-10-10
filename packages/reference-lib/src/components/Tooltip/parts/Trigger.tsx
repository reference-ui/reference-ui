/**
 * Tooltip trigger: slots tooltip behavior onto one authored child. Composes
 * the child's own ref with the tooltip and Overlay trigger refs, appends
 * the content id to `aria-describedby` while open, and chains the child's
 * pointer and focus handlers with the intent handlers from context —
 * skipping the blur close when focus lands inside the tip itself.
 */
import * as React from 'react'
import { overlayStackStore, useOverlay } from '../../Overlay'
import { TooltipContext } from '../context'

export function TooltipTrigger({ children }: { children: React.ReactElement }) {
  const context = React.useContext(TooltipContext)
  const overlay = useOverlay()

  if (!children || typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: Tooltip.Trigger expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child.props as { ref?: React.Ref<HTMLElement> }).ref

  const composedRef = (node: HTMLElement | null) => {
    if (context) context.triggerRef.current = node
    if (overlay) {
      overlay.triggerRef.current = node
      overlayStackStore.getState().setLayerTrigger(overlay.id, node)
    }
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const existingDescribedBy = child.props['aria-describedby'] || ''
  const ariaDescribedBy = context?.isOpen
    ? [existingDescribedBy, context.contentId].filter(Boolean).join(' ')
    : existingDescribedBy || undefined

  return React.cloneElement(child, {
    ref: composedRef,
    'data-reference-tooltip-trigger': '',
    'aria-describedby': ariaDescribedBy,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerEnter?.(e)
      context?.onTriggerEnter(e)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerLeave?.(e)
      context?.onTriggerLeave(e)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerDown?.(e)
      context?.onTriggerPointerDown(e)
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(e)
      context?.onTriggerFocus(e)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(e)
      const next = e.relatedTarget
      if (next instanceof Node && overlay?.contentRef.current?.contains(next)) return
      context?.onTriggerBlur(e)
    },
  })
}
