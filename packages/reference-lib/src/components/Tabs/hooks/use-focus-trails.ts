/**
 * Tabs' focus trails: the last panel to hold focus and the tab holding
 * DOM focus. Both rescue (panel hid under focus) and handoff (focused
 * tab broke) read them, and tab focus clears the panel trail — focus
 * demonstrably left the panel subtree. One hook owns both refs so the
 * two readers never disagree about which trail object is live.
 */
import * as React from 'react'

export interface FocusTrails {
  focusedPanelRef: React.RefObject<string | null>
  focusedTabRef: React.RefObject<string | null>
}

export function useFocusTrails(): FocusTrails {
  // Last panel to hold focus (FEATURES #4): set on focus-enter, never
  // cleared on blur — removal drops focus synchronously during commit, so
  // a blur-clear would erase the trail before the rescue effect reads it.
  // Stale values are safe: rescue also requires focus to be inside that
  // hidden panel or lost to the root, so focus on a tab or an external
  // control never rescues.
  const focusedPanelRef = React.useRef<string | null>(null)
  // Focused tab trail (FEATURES #6): the tab holding DOM focus, for the
  // disable/remove handoff.
  const focusedTabRef = React.useRef<string | null>(null)
  return { focusedPanelRef, focusedTabRef }
}
