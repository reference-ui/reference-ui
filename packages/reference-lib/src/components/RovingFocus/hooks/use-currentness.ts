/** Roving currentness (the sole tab stop) for a RovingFocus root.
 * `useCurrentness` owns the current id state, the SSR first-claim handshake
 * (`claimInitialActiveId`), the post-commit settlement effect that repairs a
 * stale current id against live DOM availability, and `focusItemById` — the
 * one path that sets currentness and moves DOM focus together. Currentness
 * is internal-only (FEATURES #5): no controlled-id API. */

import * as React from 'react'
import { isItemAvailable } from '../collection/availability'
import { resolveRepairTarget } from '../collection/repair'
import { resolveEntryNode } from '../shared/nodes'
import type { ItemEntry } from '../types'

export interface CurrentnessOptions {
  getOrderedItems: () => ItemEntry[]
  getEntry: (id: string) => ItemEntry | undefined
}

export interface Currentness {
  currentId: string | null
  setCurrentId: (id: string | null) => void
  claimInitialActiveId: (id: string) => boolean
  focusItemById: (id: string) => void
}

export function useCurrentness({ getOrderedItems, getEntry }: CurrentnessOptions): Currentness {
  // Currentness is internal-only (FEATURES #5): the controlled current-id API
  // was stripped per the SPEC freeze — no consumer named a use.
  const [currentId, setCurrentId] = React.useState<string | null>(null)
  const initialActiveIdRef = React.useRef<string | null>(null)
  const lastOrderRef = React.useRef<string[]>([])

  // First enabled item to render claims the SSR tab stop so server HTML carries
  // the same sole tabIndex=0 the client settles on after mount (RF-ENV-01).
  const claimInitialActiveId = React.useCallback((id: string) => {
    if (initialActiveIdRef.current === null) {
      initialActiveIdRef.current = id
      return true
    }
    return initialActiveIdRef.current === id
  }, [])

  // Post-commit settlement (RF-TAB-06/07): runs after EVERY commit with no
  // dep array on purpose. DOM-derived availability (hidden, native
  // disabled, display:none) can flip on any parent rerender without
  // touching registration, and removal deletes the entry before effects
  // run — so settle here, against post-commit DOM and the last committed
  // order. Steady state costs one DOM-order pass plus one availability
  // check; the full scan only runs when the current item actually went
  // stale, and the repaired id is always available (or null), so the next
  // pass is a no-op.
  React.useEffect(() => {
    const ordered = getOrderedItems()
    const prevOrder = lastOrderRef.current
    lastOrderRef.current = ordered.map(i => i.id)

    if (currentId === null) {
      const claimed = initialActiveIdRef.current
      if (claimed && ordered.some(i => i.id === claimed && isItemAvailable(i))) {
        setCurrentId(claimed)
        return
      }
      const firstAvailable = ordered.find(isItemAvailable)
      if (firstAvailable) {
        setCurrentId(firstAvailable.id)
      }
      return
    }

    const currentEntry = ordered.find(i => i.id === currentId)
    if (currentEntry && isItemAvailable(currentEntry)) return
    const orderIds = prevOrder.includes(currentId) ? prevOrder : ordered.map(i => i.id)
    setCurrentId(resolveRepairTarget(ordered, orderIds, currentId))
  })

  const focusItemById = React.useCallback(
    (id: string) => {
      const entry = getEntry(id)
      const node = entry ? resolveEntryNode(entry) : null
      if (entry && node && isItemAvailable(entry)) {
        setCurrentId(id)
        node.focus()
      }
    },
    [getEntry]
  )

  return React.useMemo(
    () => ({ currentId, setCurrentId, claimInitialActiveId, focusItemById }),
    [currentId, claimInitialActiveId, focusItemById]
  )
}
