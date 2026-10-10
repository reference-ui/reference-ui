/**
 * Menu's keyboard-entry intent: the pending first/last strategy a
 * trigger keypress plants and the root Menu consumes once per open.
 * The trigger lives outside the mounted Menu, so the opening key is
 * recorded in this module cell; the UNCONSUMED sentinel lets the root
 * survive StrictMode effect replay and reset on close. Unit-tested.
 */
import type { MenuEntryStrategy } from '../types'

// Pending trigger-key entry intent. The trigger lives outside the mounted
// Menu (it stays mounted while the Popover is closed), so the opening key is
// recorded here by useMenuTriggerKeys and consumed once per open by Menu.
let pendingMenuEntry: MenuEntryStrategy = null

export function setMenuEntryIntent(strategy: MenuEntryStrategy) {
  pendingMenuEntry = strategy
}

export function consumeMenuEntryIntent(): MenuEntryStrategy {
  const strategy = pendingMenuEntry
  pendingMenuEntry = null
  return strategy
}

export const UNCONSUMED: unique symbol = Symbol('unconsumed')
