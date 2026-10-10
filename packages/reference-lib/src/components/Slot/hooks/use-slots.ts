/**
 * `createUseSlots` binds the multi-region host read to one slot context.
 * The optional filter is held in a latest-ref so inline closures need no
 * `useCallback` and never resubscribe, and the filtered path caches its
 * result array element-wise so unrelated registrations keep returning the
 * same identity. Without a filter it snapshots `root.getAll()` directly.
 */
import * as React from 'react'
import type { SlotRoot } from '../registry/store'
import type { SlotRegistration } from '../types'

export function createUseSlots<TMeta>(
  useRoot: () => SlotRoot<TMeta>
): (filter?: (slot: SlotRegistration<TMeta>) => boolean) => SlotRegistration<TMeta>[] {
  function useSlots(
    filter?: (slot: SlotRegistration<TMeta>) => boolean
  ): SlotRegistration<TMeta>[] {
    const root = useRoot()
    // Latest-filter ref: inline closures need no useCallback. The store
    // subscription is version-based, so a new closure identity never
    // resubscribes — the filter is applied at snapshot time.
    const filterRef = React.useRef(filter)
    filterRef.current = filter
    const subscribe = React.useCallback(
      (onStoreChange: () => void) => root.subscribe(onStoreChange),
      [root]
    )
    // Identity cache for the filtered path: the match set is compared
    // element-wise so unrelated registrations keep returning the same array.
    const cacheRef = React.useRef<SlotRegistration<TMeta>[]>([])
    const getSnapshot = React.useCallback(() => {
      const currentFilter = filterRef.current
      if (!currentFilter) {
        return root.getAll()
      }
      const next = root.select(currentFilter)
      const cached = cacheRef.current
      if (
        next.length === cached.length &&
        next.every((slot, index) => slot === cached[index])
      ) {
        return cached
      }
      cacheRef.current = next
      return next
    }, [root])

    return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  }
  return useSlots
}
