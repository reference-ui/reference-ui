/** RovingFocus subtree scoping: the context object Items read, the value
 * shape the Root provides, and the `useRovingFocusContext` seam composed
 * policies (Tabs selection sync) consume. The context object itself stays
 * folder-private; only the hook and the value type are public. Imports the
 * orientation type only, so providers and readers share one contract. */

import * as React from 'react'
import type { ItemEntry, RovingFocusOrientation } from './types'

export interface RovingFocusContextValue {
  orientation: RovingFocusOrientation
  loop: boolean
  typeahead: boolean
  currentId: string | null
  setCurrentId: (id: string) => void
  registerItem: (entry: ItemEntry) => () => void
  focusItemById: (id: string) => void
  onItemKeyDown: (e: React.KeyboardEvent<HTMLElement>, id: string) => void
  claimInitialActiveId: (id: string) => boolean
}

export const RovingFocusContext = React.createContext<RovingFocusContextValue | null>(null)

// Composed-policy seam (finish-line P2D): Tabs owns activation policy, so
// it syncs selection into kernel currentness through this hook — reading
// currentId and writing it on selection/registry changes. Additive export
// only; kernel movement, settlement, and slot behavior are unchanged.
export function useRovingFocusContext(): RovingFocusContextValue | null {
  return React.useContext(RovingFocusContext)
}
