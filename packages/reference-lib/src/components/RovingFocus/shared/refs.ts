/** Slot ref plumbing for the RovingFocus kernel. `chainSlotRefs` fans one
 * mounted node out to every ref in the chain — the kernel's own item ref,
 * the authored child's ref, and the consumer's forwarded ref — accepting
 * callback and object refs alike. `getChildRef` reads the child's ref
 * through the shared Presence helper so React 19's removed `element.ref`
 * accessor is never touched. */

import * as React from 'react'
import { getElementRef } from '../../Presence/shared/element-ref'

export function setSlotRef(ref: unknown, node: HTMLElement | null): void {
  if (typeof ref === 'function') {
    ;(ref as (node: HTMLElement | null) => void)(node)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
  }
}

export function chainSlotRefs(...refs: unknown[]): (node: HTMLElement | null) => void {
  return function chainedSlotRef(node: HTMLElement | null) {
    for (const ref of refs) setSlotRef(ref, node)
  }
}

// Pre-19 React strips ref from props into element.ref; 19 exposes both.
// Descriptor-only read: touching element.ref trips React 19's
// removed-accessor warning, so child refs survive via the shared helper.
export function getChildRef(child: React.ReactElement): unknown {
  return getElementRef(child)
}
