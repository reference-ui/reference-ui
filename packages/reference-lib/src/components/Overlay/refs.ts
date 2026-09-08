import * as React from 'react'

export function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref && typeof ref === 'object') {
    ;(ref as React.MutableRefObject<T | null>).current = node
  }
}

/** Stable callback ref that always forwards to the latest `ref` without identity churn. */
export function useComposedRef<T>(
  ...refs: Array<React.Ref<T> | undefined | ((node: T | null) => void)>
): React.RefCallback<T> {
  const latest = React.useRef(refs)
  latest.current = refs
  return React.useCallback((node: T | null) => {
    for (const ref of latest.current) assignRef(ref, node)
  }, [])
}
