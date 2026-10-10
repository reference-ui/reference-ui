/**
 * Tabs' tab ordering: DOM-ordered enabled and full value lists plus
 * nearest-enabled fallback. Takes the tab entries and registry version,
 * returns the order callbacks and the enabled list the selection sync
 * reads. Ordering delegates to the registry kernel so the pure
 * comparators stay unit-tested while the hook owns the React wiring.
 */
import * as React from 'react'
import type { TabsTabEntry } from '../context'
import { nearestEnabledValue } from '../registry/nearest'
import { byDocumentPosition, isLiveElement } from '../registry/order'

export function useTabsOrder({ tabEntries, registryVersion }: {
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
  registryVersion: number
}) {
  // DOM-ordered enabled tabs (FEATURES #8, #4, #6): registry insertion
  // order goes stale across reorders (TB-DYNAMIC-01), so enabled entries
  // sort by document position. Detached entries are excluded; entries
  // without a measured element keep their relative order.
  const getOrderedEnabledTabs = React.useCallback((): string[] => {
    return Array.from(tabEntries.current.entries())
      .filter(([, entry]) => !entry.disabled && isLiveElement(entry.element))
      .sort(([, a], [, b]) => byDocumentPosition(a, b))
      .map(([tabValue]) => tabValue)
  }, [])

  // DOM-ordered connected tabs (FEATURES #4, #6): the full list that
  // nearest-enabled fallback walks; disabled entries included so distance
  // is measured in tab order, not enabled order.
  const getOrderedTabs = React.useCallback((): string[] => {
    return Array.from(tabEntries.current.entries())
      .filter(([, entry]) => isLiveElement(entry.element))
      .sort(([, a], [, b]) => byDocumentPosition(a, b))
      .map(([tabValue]) => tabValue)
  }, [])

  // Nearest enabled tab to a value in tab order; ties go to the
  // preceding tab (TESTS tie-break, FEATURES #6). Unknown values fall
  // back to first-enabled. An explicit order override lets removals walk
  // the pre-removal positions (the removed value is already gone from
  // the live registry when the handoff effect runs).
  const nearestEnabledTab = React.useCallback(
    (fromValue: string, allOverride?: string[]): string | undefined => {
      return nearestEnabledValue(fromValue, getOrderedEnabledTabs(), allOverride ?? getOrderedTabs())
    },
    [getOrderedEnabledTabs, getOrderedTabs]
  )

  // Ordered enabled values for the selection sync, recomputed per
  // registry commit (identity-stable between bumps).
  const enabledTabValues = React.useMemo(
    () => getOrderedEnabledTabs(),
    [registryVersion, getOrderedEnabledTabs]
  )

  return { getOrderedEnabledTabs, getOrderedTabs, nearestEnabledTab, enabledTabValues }
}
