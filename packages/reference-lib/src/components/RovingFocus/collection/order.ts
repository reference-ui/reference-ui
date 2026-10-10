/** DOM-order collection sorting for the RovingFocus kernel. `orderEntriesByDom`
 * drops disconnected entries and sorts the rest by document position, so
 * insertion, keyed reorder, and removal (RF-DOM-04) are all observed through
 * live node geometry rather than registration order. The registry hook feeds
 * it the raw map values on every read; nothing is cached. */

import type { ItemEntry } from '../types'
import { resolveEntryNode } from '../shared/nodes'

export function orderEntriesByDom(entries: ItemEntry[]): ItemEntry[] {
  // Sort items by DOM position
  return entries
    .filter(entry => {
      const node = resolveEntryNode(entry)
      return node && node.isConnected
    })
    .sort((a, b) => {
      const elA = resolveEntryNode(a)!
      const elB = resolveEntryNode(b)!
      const pos = elA.compareDocumentPosition(elB)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
}
