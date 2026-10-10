/**
 * Tabs' disabled/removed-tab handoff: when the focused tab disables or
 * unmounts, focus moves to the nearest enabled tab (ties to preceding)
 * while selection, the visible panel, and onChange stay untouched.
 * Takes the registry version, order readers, and entries; returns the
 * tab-focus notifier tabs call on focus. Removals walk pre-removal
 * positions so distance is measured from where the tab stood.
 */
import * as React from 'react'
import type { TabsTabEntry } from '../context'
import { getDeepActiveElement } from '../focus/deep-active'

export function useTabHandoff({ registryVersion, getOrderedTabs, nearestEnabledTab, tabEntries, focusedPanelRef, focusedTabRef }: {
  registryVersion: number
  getOrderedTabs: () => string[]
  nearestEnabledTab: (fromValue: string, allOverride?: string[]) => string | undefined
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
  focusedPanelRef: React.RefObject<string | null>
  focusedTabRef: React.RefObject<string | null>
}) {
  // Focusing a tab also clears the panel trail — focus demonstrably left
  // the panel subtree.
  const noteTabFocus = React.useCallback((tabValue: string) => {
    focusedTabRef.current = tabValue
    focusedPanelRef.current = null
  }, [])

  // Pre-change tab order (FEATURES #6): removals walk the positions from
  // before the removal commit, so nearest-enabled is measured from where
  // the focused tab stood, not from first-enabled.
  const prevTabOrderRef = React.useRef<string[]>([])

  // Disabled/removed-tab handoff (TB-DYNAMIC-03, FEATURES #6): when the
  // focused tab disables or unmounts, focus moves to the nearest enabled
  // tab (ties to preceding), while selection and the visible panel stay
  // unchanged and no request fires. The kernel tab stop follows via the
  // focus itself. Focus that already moved elsewhere is never stolen.
  React.useEffect(() => {
    const currentOrder = getOrderedTabs()
    const walkOrder =
      prevTabOrderRef.current.length > 0
        ? prevTabOrderRef.current
        : currentOrder
    prevTabOrderRef.current = currentOrder
    const focused = focusedTabRef.current
    if (focused === null) return
    const entry = tabEntries.current.get(focused)
    const broken =
      !entry ||
      entry.disabled ||
      (entry.element !== null && !entry.element.isConnected)
    if (!broken) return
    let scope: Element | null = entry?.element ?? null
    if (!scope) {
      for (const candidate of tabEntries.current.values()) {
        if (candidate.element) {
          scope = candidate.element
          break
        }
      }
    }
    if (!scope && typeof document !== 'undefined') {
      scope = document.documentElement
    }
    if (!scope) return
    const active = getDeepActiveElement(scope)
    const ownerDoc =
      scope.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    const lost = !active || (ownerDoc !== null && active === ownerDoc.body)
    const onBroken = entry?.element != null && active === entry.element
    if (!lost && !onBroken) return
    const target = nearestEnabledTab(focused, walkOrder)
    if (target === undefined) return
    const targetEl = tabEntries.current.get(target)?.element
    if (targetEl && targetEl.isConnected) {
      focusedTabRef.current = target
      targetEl.focus()
    }
  }, [registryVersion, getOrderedTabs, nearestEnabledTab])
  return { noteTabFocus }
}
