/** Item registry for a RovingFocus root. `useItemRegistry` owns the id-keyed
 * entry map Items register into on mount, plus the registration bump that
 * forces the rerender letting post-commit settlement observe mounts and
 * unmounts. Reads always go through live DOM order (`orderEntriesByDom`),
 * never registration order, so keyed insert/reorder/remove just works. */

import * as React from 'react'
import type { ItemEntry } from '../types'
import { orderEntriesByDom } from '../collection/order'

export interface ItemRegistry {
  registerItem: (entry: ItemEntry) => () => void
  getOrderedItems: () => ItemEntry[]
  getEntry: (id: string) => ItemEntry | undefined
}

export function useItemRegistry(): ItemRegistry {
  const itemsMapRef = React.useRef<Map<string, ItemEntry>>(new Map())
  // Registration bump: forces the rerender that lets post-commit
  // settlement observe mounts/unmounts. The value itself is unread.
  const [, setRegistrationVersion] = React.useState(0)

  const notifyItemsChanged = React.useCallback(() => {
    setRegistrationVersion(v => v + 1)
  }, [])

  const getOrderedItems = React.useCallback((): ItemEntry[] => {
    return orderEntriesByDom(Array.from(itemsMapRef.current.values()))
  }, [])

  const registerItem = React.useCallback(
    (entry: ItemEntry) => {
      itemsMapRef.current.set(entry.id, entry)
      notifyItemsChanged()
      return () => {
        itemsMapRef.current.delete(entry.id)
        notifyItemsChanged()
      }
    },
    [notifyItemsChanged]
  )

  const getEntry = React.useCallback(
    (id: string) => itemsMapRef.current.get(id),
    []
  )

  return React.useMemo(
    () => ({ registerItem, getOrderedItems, getEntry }),
    [registerItem, getOrderedItems, getEntry]
  )
}
