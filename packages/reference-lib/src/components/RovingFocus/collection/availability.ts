/** Item availability for the RovingFocus kernel. `isItemAvailable` is the
 * single predicate every navigation, settlement, and search path consults:
 * an entry counts only when its prop, its native and ARIA disabled state,
 * its hidden state, and its computed display/visibility all agree it can
 * take focus. Unmounted entries (no node yet) read as available so the first
 * settlement pass can claim them. */

import type { ItemEntry } from '../types'
import { resolveEntryNode } from '../shared/nodes'

export function isItemAvailable(entry: ItemEntry): boolean {
  if (entry.disabled) return false
  const el = resolveEntryNode(entry)
  if (!el) return true
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
    return false
  }
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
    return false
  }
  if (typeof window !== 'undefined') {
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false
    }
  }
  return true
}
