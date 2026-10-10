/**
 * Ref plumbing for the transparent child. assignRef writes one host node
 * into a function ref, an object ref, or nothing at all, so the composed
 * callback can fan the container out to the consumer ref and the forwarded
 * ref without repeating React's ref-shape checks at every call site.
 */
import type * as React from 'react'

export function assignRef(ref: React.Ref<HTMLElement> | undefined, node: HTMLElement | null): void {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
  }
}
