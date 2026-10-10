/**
 * Tree's ref fan-out: one callback ref that writes the node into every
 * forwarded, object, or callback ref the caller hands over, so parts can
 * keep an internal node handle while still honoring the consumer's ref.
 * Items and groups compose it; the root keeps its inline original.
 */
import * as React from 'react'

export function useComposedRefs<T>(
  ...refs: Array<React.ForwardedRef<T> | React.Ref<T> | React.MutableRefObject<T | null> | null | undefined>
) {
  return React.useCallback(
    (node: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return
        if (typeof ref === 'function') {
          ref(node)
        } else if (typeof ref === 'object' && 'current' in ref) {
          ;(ref as React.MutableRefObject<T | null>).current = node
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  )
}
