/**
 * Tabs' panel focus rescue: a programmatic selection change that hides
 * the focused panel moves focus to the newly selected tab (or its
 * nearest enabled fallback) with no onChange. Takes the value, the
 * fallback resolver, and the entries; returns the panel-focus notifier
 * panels call on focus-enter. Focus anywhere else is never stolen.
 */
import * as React from 'react'
import type { TabsPanelEntry, TabsTabEntry } from '../context'
import { getDeepActiveElement } from '../focus/deep-active'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'

export function useFocusRescue({ value, nearestEnabledTab, tabEntries, panelEntries, focusedPanelRef }: {
  value: string
  nearestEnabledTab: (fromValue: string, allOverride?: string[]) => string | undefined
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
  panelEntries: React.RefObject<Map<string, TabsPanelEntry>>
  focusedPanelRef: React.RefObject<string | null>
}) {
  const notePanelFocus = React.useCallback((panelValue: string) => {
    focusedPanelRef.current = panelValue
  }, [])

  // Focus rescue (TB-SELECT-07, FEATURES #4): a programmatic selection
  // change that hides the focused panel moves focus to the newly selected
  // Tab — or the nearest enabled fallback when that tab is disabled —
  // with no onChange. Fires when focus is still inside the hidden panel
  // (keepMounted, display:none drop pending) or was lost to the root by
  // the unmounting children. Focus anywhere else (a tab, an external
  // control) is left untouched — never stolen. The kernel tab stop
  // follows via the focus itself (Item onFocus sets currentness).
  useIsomorphicLayoutEffect(() => {
    const lastPanel = focusedPanelRef.current
    if (lastPanel === null || lastPanel === value) return
    let scope: Element | null = null
    for (const entry of tabEntries.current.values()) {
      if (entry.element) {
        scope = entry.element
        break
      }
    }
    if (!scope && typeof document !== 'undefined') scope = document.documentElement
    if (!scope) return
    const active = getDeepActiveElement(scope)
    const panelEl = panelEntries.current.get(lastPanel)?.element
    const insideHidden =
      active instanceof HTMLElement && !!panelEl?.contains(active)
    const ownerDoc =
      scope.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    const lost = !active || (ownerDoc !== null && active === ownerDoc.body)
    if (!insideHidden && !lost) return
    focusedPanelRef.current = null
    const target = nearestEnabledTab(value)
    if (target === undefined) return
    const targetEl = tabEntries.current.get(target)?.element
    if (targetEl && targetEl.isConnected) {
      targetEl.focus()
    }
  }, [value, nearestEnabledTab])
  return { notePanelFocus }
}
