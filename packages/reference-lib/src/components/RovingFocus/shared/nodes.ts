/** Item node resolution for the RovingFocus kernel. `resolveEntryNode`
 * reads the live ref first and the portable `getNode` resolver second, so
 * ref-stripped trees (Menubar triggers on React 17/18) order, settle, and
 * focus exactly like ref-resolved ones. Every kernel node read runs through
 * this one function. */

import type { ItemEntry } from '../types'

// Live ref first, portable resolver second. Every kernel node read runs
// through this so ref-stripped trees (Menubar triggers on React 17/18)
// order, settle, and focus exactly like ref-resolved ones.
export function resolveEntryNode(entry: ItemEntry): HTMLElement | null {
  return entry.ref.current ?? entry.getNode?.() ?? null
}
