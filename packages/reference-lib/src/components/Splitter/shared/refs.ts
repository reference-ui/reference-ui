/**
 * Ref plumbing every part shares: the isomorphic layout effect that stays
 * passive under SSR, and the composed ref that merges the kernel's
 * registration/geometry ref with the consumer's forwarded ref — object and
 * callback forms, no loops.
 */
import * as React from 'react'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

// SP-DOM-07: consumer refs compose with the kernel's registration/geometry
// refs onto the same native node — object and callback forms, no loops.
export function useComposedRef<T>(
  internalRef: React.RefObject<T | null>,
  forwardedRef: React.ForwardedRef<T>
): (node: T | null) => void {
  return React.useCallback(
    (node: T | null) => {
      internalRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        ;(forwardedRef as React.MutableRefObject<T | null>).current = node
      }
    },
    [internalRef, forwardedRef]
  )
}
