/**
 * Ref plumbing for the accordion root. composeRefs fans one host node out to
 * the internal root ref and the forwarded consumer ref, collecting the React
 * 19 cleanup functions function refs return so unmount still runs every
 * teardown the callers handed back.
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
