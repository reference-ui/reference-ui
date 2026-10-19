/**
 * Ref assignment under the React 19 cleanup contract: object refs take
 * the node, callback refs run with their cleanup returned, undefined
 * refs are ignored. Shared by the kernel and the composed-ref hook.
 */
import type * as React from 'react'

/**
 * Ref plumbing shared by Presence and its composed-ref hook. `setRef` assigns
 * a node to one object or callback ref and returns whatever a callback ref
 * returns, so the caller can detect the React 19 cleanup-function contract;
 * `PossibleRef` is the nullable ref union every composer accepts. The stable
 * composer itself is a hook (`hooks/use-stable-composed-refs`) because it
 * needs `useRef`/`useCallback` identity guarantees.
 */

export type PossibleRef<T> = React.Ref<T> | undefined

export function setRef<T>(ref: PossibleRef<T>, value: T | null): unknown {
  if (typeof ref === 'function') {
    return ref(value)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}
