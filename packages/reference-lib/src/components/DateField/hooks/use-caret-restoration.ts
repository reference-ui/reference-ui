/**
 * Pending caret restoration for segment stepping. A key handler files a
 * request that pairs its target input with the desired caret position; the
 * matching revision bump forces a commit so an isomorphic layout effect can
 * consume the request before paint, after the committed input value is in the
 * DOM. Consumption clears the ref first, then restores synchronously only when
 * the target is still connected and focused, so an old request can never
 * overwrite a newer authored selection.
 */
import * as React from 'react'
import { restoreCaretAt } from '../shared/caret'

// Layout before paint in the browser so the caret lands with the committed
// value; plain effect on the server where layout effects warn and never run.
const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

interface CaretRequest {
  target: HTMLInputElement | null
  pos: number
}

export function useCaretRestoration() {
  const pendingRef = React.useRef<CaretRequest | null>(null)
  const [revision, setRevision] = React.useState(0)

  const requestCaretRestore = React.useCallback(
    (target: HTMLInputElement | null, pos: number) => {
      // A fresh object plus a revision bump guarantees the effect commits even
      // when the request repeats (rejected step, same buffer and position).
      pendingRef.current = { target, pos }
      setRevision((value) => value + 1)
    },
    []
  )

  // Consume the pending request after the commit that published the stepped
  // text. Clearing the ref before restoring means no later frame can replay it.
  useIsomorphicLayoutEffect(() => {
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending == null) return
    const { target, pos } = pending
    if (target == null || !target.isConnected) return
    // Focus can belong to a ShadowRoot (the host is activeElement on the
    // document), so compare against the element's own root, not the document.
    const root = target.getRootNode()
    if (!('activeElement' in root) || root.activeElement !== target) return
    restoreCaretAt(target, pos)
  }, [revision])

  // Unmount clears any request that never committed; no writes are scheduled
  // beyond the committed effect above.
  useIsomorphicLayoutEffect(() => {
    return () => {
      pendingRef.current = null
    }
  }, [])

  return requestCaretRestore
}
