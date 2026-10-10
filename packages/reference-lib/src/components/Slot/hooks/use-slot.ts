/**
 * `createUseSlot` binds the single-region host read to one slot context:
 * it subscribes to the store version via `useSyncExternalStore` and returns
 * `getById` live on every render. The subscription is version-based, so
 * re-renders fire only for structural set changes, never for live content.
 */
import * as React from 'react'
import type { SlotRoot } from '../registry/store'
import type { SlotRegistration } from '../types'

export function createUseSlot<TMeta>(
  useRoot: () => SlotRoot<TMeta>
): (slotId: string) => SlotRegistration<TMeta> | undefined {
  function useSlot(slotId: string): SlotRegistration<TMeta> | undefined {
    const root = useRoot()
    const subscribe = React.useCallback(
      (onStoreChange: () => void) => root.subscribe(onStoreChange),
      [root]
    )
    const getSnapshot = React.useCallback(() => root.getVersion(), [root])

    // Subscribe to version changes to trigger re-renders
    React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    return root.getById(slotId)
  }
  return useSlot
}
