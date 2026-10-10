/**
 * Fans one host node into many refs: callback refs run (their cleanups
 * collected and returned as one), object refs are assigned, nullish refs
 * are skipped. Returns a cleanup only when at least one callback ref
 * handed one back, so StrictMode replay stays balanced.
 */
import type * as React from 'react'

export function composeRefs<T>(...refs: (React.Ref<T> | undefined | null)[]) {
  return (node: T | null) => {
    const cleanups: (() => void)[] = []
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        if (typeof cleanup === 'function') {
          cleanups.push(cleanup)
        }
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<T | null>).current = node
      }
    }
    if (cleanups.length > 0) {
      return () => {
        for (const cleanup of cleanups) {
          cleanup()
        }
      }
    }
  }
}
