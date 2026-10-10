/**
 * Live nodes of descendant layers, deepest first, for FocusLock sharding.
 * Subscribes to the document stack through a compact layer key so the memo
 * recomputes only when child membership or nodes change. Used only by
 * `parts/Content`.
 */
import * as React from 'react'
import type { OverlayContextValue } from '../context'
import { descendantsDeepestFirst, overlayStackStore, useOverlayStore } from '../stack'

export function useChildShards(context: OverlayContextValue | null): HTMLElement[] {
  const childLayerKey = useOverlayStore(state => {
    if (!context?.id) return ''
    return descendantsDeepestFirst(state.layers, context.id)
      .map(l => `${l.id}:${l.node ? 1 : 0}`)
      .join(',')
  })

  return React.useMemo(() => {
    if (!context) return []
    return descendantsDeepestFirst(overlayStackStore.getState().layers, context.id)
      .map(l => l.node)
      .filter((n): n is HTMLElement => n !== null)
  }, [context, childLayerKey])
}
