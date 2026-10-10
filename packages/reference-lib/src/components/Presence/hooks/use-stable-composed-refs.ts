import * as React from 'react'
import { setRef, type PossibleRef } from '../shared/refs'

/**
 * One stable callback ref fanning out to many. Presence observes its child
 * through its own ref while preserving the consumer's ref; this hook composes
 * both into a single callback whose identity never changes, so unrelated
 * rerenders don't detach and reattach the node (PR-REF-03). When any
 * composed callback ref returns a cleanup (the React 19 contract), the
 * composer returns a combined cleanup that runs each callback's cleanup — or
 * falls back to assigning `null` for refs without one (PR-REF-04). Latest
 * refs win through a ref mirror, so inline consumer callbacks stay fresh
 * without breaking stability.
 */

export function useStableComposedRefs<T>(
  ...refs: PossibleRef<T>[]
): React.RefCallback<T> {
  const refsRef = React.useRef(refs)
  refsRef.current = refs

  return React.useCallback((node: T | null) => {
    const currentRefs = refsRef.current
    let hasCleanup = false
    const cleanups = currentRefs.map(ref => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === 'function') {
            cleanup()
          } else {
            setRef(currentRefs[i], null)
          }
        }
      }
    }
  }, [])
}
