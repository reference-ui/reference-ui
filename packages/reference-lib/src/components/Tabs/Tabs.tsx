/**
 * Tabs root: optional-value composition. Takes children, an optional
 * controlled value, onChange, orientation, activation, variant, and
 * keepMounted; provides the registry-backed context the parts read and
 * assigns the List/Tab/Trigger/Panel/Content compounds. Every behavior
 * lives in hooks/, every rendering in parts/, every pure decision in
 * registry/ or focus/ with its own tests.
 */
import * as React from 'react'
import { TabsContext, type TabsContextValue } from './context'
import {
  useFocusRescue,
  useFocusTrails,
  useTabHandoff,
  useTabsDiagnostics,
  useTabsOrder,
  useTabsRegistry,
  useTabsValue,
} from './hooks'
import type { TabsProps } from './types'
import { TabsList } from './parts/list'
import { Tab } from './parts/tab'
import { TabPanel } from './parts/panel'

export function Tabs({
  children,
  value: valueProp,
  onChange,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'line',
  keepMounted = false,
}: TabsProps) {
const reactId = React.useId()
  const [baseId] = React.useState(() => `tabs-${reactId.replace(/:/g, '')}`)

  const registry = useTabsRegistry()
  const {
    claimTabValue, claimPanelValue, tabEntries, panelEntries, registryVersion,
    registerTab, registerPanel, getTabId, getPanelId, hasTab, hasPanel,
    linkageSettled, listCount, listCountRef, registerList,
  } = registry
  const order = useTabsOrder({ tabEntries, registryVersion })
  const { getOrderedEnabledTabs, getOrderedTabs, nearestEnabledTab, enabledTabValues } = order
  const { value, setValue } = useTabsValue({
    valueProp, onChange, getOrderedEnabledTabs, registryVersion, tabEntries,
  })
  useTabsDiagnostics({ registryVersion, listCount, tabEntries, panelEntries, listCountRef })
  const { focusedPanelRef, focusedTabRef } = useFocusTrails()
  const { notePanelFocus } = useFocusRescue({ value, nearestEnabledTab, tabEntries, panelEntries, focusedPanelRef })
  const { noteTabFocus } = useTabHandoff({ registryVersion, getOrderedTabs, nearestEnabledTab, tabEntries, focusedPanelRef, focusedTabRef })

// Selection→currentness target (TB-SELECT-03, FEATURES #8): the
  // selected value when it names an enabled tab, else first-enabled, else
  // null. Applied by TabsSelectionSync inside the RovingFocus root; null
  // leaves the stop to kernel settlement (all-disabled → zero stops,
  // TB-DOM-11). Consumed on value/registry change only — manual
  // focus-diverged stops are never snapped back (TB-MANUAL-01).
  const selectionSyncTarget: string | null = enabledTabValues.includes(value)
    ? value
    : (enabledTabValues[0] ?? null)

const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      orientation,
      activation,
      variant,
      keepMounted,
      baseId,
      selectionSyncTarget,
      linkageSettled,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      registerList,
      getTabId,
      getPanelId,
      hasTab,
      hasPanel,
      notePanelFocus,
      noteTabFocus,
    }),
    [
      value,
      setValue,
      orientation,
      activation,
      variant,
      keepMounted,
      baseId,
      selectionSyncTarget,
      linkageSettled,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      registerList,
      getTabId,
      getPanelId,
      hasTab,
      hasPanel,
      notePanelFocus,
      noteTabFocus,
      // Unread by the factory: bumps re-render ARIA-linkage readers.
      registryVersion,
    ]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  )
}

export const TabsTrigger = Tab
export const TabsContent = TabPanel

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Trigger = Tab
Tabs.Panel = TabPanel
Tabs.Content = TabPanel

export type {
  TabsOrientation,
  TabsActivation,
  TabsVariant,
  TabsVariantProp,
  TabsProps,
  TabsListProps,
  TabProps,
  TabPanelProps,
} from './types'
export { tabsListRecipe } from './recipes/list-recipe'
export { tabsTabRecipe } from './recipes/tab-recipe'
export { TabsList } from './parts/list'
export { Tab } from './parts/tab'
export { TabPanel } from './parts/panel'
