/**
 * DOM plumbing the field shares: the isomorphic layout effect that stays
 * passive under SSR, and the native input write that React's change
 * tracker still treats as a user edit.
 */
import * as React from 'react'

// Layout effect where a window exists, passive effect under SSR (avoids the
// server useLayoutEffect warning for labelledby verification).
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

// Programmatic value write that React's change tracker still treats as
// a user edit: writing through the prototype setter (not the instance
// property React wraps) keeps a following synthetic input event real.
export function setNativeInputValue(node: HTMLInputElement, text: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')
  if (descriptor?.set) {
    descriptor.set.call(node, text)
  } else {
    node.value = text
  }
}
