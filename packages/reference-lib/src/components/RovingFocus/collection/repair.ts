/** Stale-current repair for the RovingFocus kernel (RF-TAB-06). When the
 * current item is disabled, hidden, or removed, `resolveRepairTarget` picks
 * its successor in the last committed DOM order — scanning forward first,
 * then backward — and falls back to the first available item when the stale
 * id is unknown. Removal deletes the entry before repair runs, which is why
 * the previous order (still containing the id) is an explicit input rather
 * than derived from the live collection. */

import type { ItemEntry } from '../types'
import { isItemAvailable } from './availability'

// Next-then-previous repair (RF-TAB-06): resolve the successor of a stale
// current id against a DOM order that may still contain it. Removal deletes
// the entry before repair runs, so resolving against the live map alone would
// fall back to the first item instead of the removed item's successor.
export function resolveRepairTarget(
  ordered: ItemEntry[],
  orderIds: string[],
  currentId: string
): string | null {
  const available = ordered.filter(isItemAvailable)
  if (available.length === 0) return null
  const orderIndex = orderIds.indexOf(currentId)
  if (orderIndex === -1) {
    const first = available[0]
    return first ? first.id : null
  }
  const availableIds = new Set(available.map(i => i.id))
  for (let i = orderIndex + 1; i < orderIds.length; i++) {
    const id = orderIds[i]
    if (id !== undefined && availableIds.has(id)) return id
  }
  for (let i = orderIndex - 1; i >= 0; i--) {
    const id = orderIds[i]
    if (id !== undefined && availableIds.has(id)) return id
  }
  const first = available[0]
  return first ? first.id : null
}
