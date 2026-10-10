/**
 * Ref plumbing for the trigger and the panel. setRef writes one host node
 * into a function ref, an object ref, or nothing at all, passing through the
 * React 19 cleanup a function ref returns so the composed callbacks stay one
 * line each.
 */
import type * as React from 'react'

export function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): (() => void) | void {
  if (typeof ref === 'function') {
    return ref(value)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}
