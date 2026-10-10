/**
 * Tab order and Tab cycling for `isolation.focus === false`. `tabbables`
 * and `nextAfter` solve the tab order over live DOM; `useTabCycle` wires
 * the document keydown listener that keeps an unisolated layer's Tab
 * inside it — pulling focus in from the trigger, closing the layer on
 * forward wrap past the last item. Used only by `parts/Content`.
 */
import * as React from 'react'
import type { OverlayContextValue } from '../context'

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function isVisible(el: HTMLElement): boolean {
  if (el.closest('[inert], [hidden], [aria-hidden="true"]')) return false
  const style = el.ownerDocument.defaultView?.getComputedStyle(el)
  return style?.display !== 'none' && style?.visibility !== 'hidden'
}

export function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(isVisible)
}

export function nextAfter(el: HTMLElement, exclude?: HTMLElement | null): HTMLElement | null {
  const all = Array.from(el.ownerDocument.querySelectorAll<HTMLElement>(TABBABLE)).filter(cand => {
    if (exclude && (cand === exclude || exclude.contains(cand))) return false
    return isVisible(cand)
  })
  const idx = all.indexOf(el)
  return all[idx + 1] ?? null
}

export function useTabCycle(options: {
  context: OverlayContextValue | null
  node: HTMLDivElement | null
  isOpen: boolean
  focusIsolated: boolean | undefined
}) {
  const { context, node, isOpen, focusIsolated } = options
  React.useEffect(() => {
    if (!context || focusIsolated || !isOpen || !node) return
    const trigger = context.triggerRef.current
    if (!trigger) return
    const doc = node.ownerDocument
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return
      const items = tabbables(node)
      if (items.length === 0) return
      const active = doc.activeElement
      const first = items[0]
      const last = items[items.length - 1]
      if (!e.shiftKey && (active === trigger || trigger.contains(active))) {
        e.preventDefault()
        first?.focus()
        return
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault()
        context.setIsOpen(false)
        nextAfter(trigger, node)?.focus()
      }
      if (e.shiftKey && active === first) {
        e.preventDefault()
        trigger.focus()
      }
    }
    doc.addEventListener('keydown', onKeyDown)
    return () => doc.removeEventListener('keydown', onKeyDown)
  }, [context, focusIsolated, isOpen, node])
}
