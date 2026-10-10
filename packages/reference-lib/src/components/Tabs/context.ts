/**
 * Tabs' private subtree scoping: the value, orientation, activation,
 * and variant every part reads, plus the identity registry (claims,
 * entries, ARIA id lookups) and the focus trails rescue effects follow.
 * The root provides it; List, Tab, Panel, and the selection sync
 * consume it. Nothing here renders — it only names the shared scope.
 */
import * as React from 'react'
import type { TabsActivation, TabsOrientation, TabsVariantProp } from './types'

export interface TabsTabEntry {
  id: string
  element: HTMLElement | null
  disabled: boolean
}

export interface TabsPanelEntry {
  id: string
  element: HTMLElement | null
}

export interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  orientation: TabsOrientation
  activation: TabsActivation
  variant: TabsVariantProp
  keepMounted: boolean
  baseId: string
  // Selection→currentness sync (kernel composition): the tab value that
  // should hold the kernel tab stop — the selected value when it names an
  // enabled tab, else first-enabled, else null (kernel settlement owns the
  // all-disabled zero-stop state). Consumed by TabsSelectionSync inside the
  // RovingFocus root; the kernel owns focus-following currentness.
  selectionSyncTarget: string | null
  // True once client layout effects have run (never in SSR): ARIA
  // references render from generated fallbacks until set, then omit when
  // the live registry lacks the counterpart (TB-ENV-01 vs TB-DOM-13).
  linkageSettled: boolean
  claimTabValue: (tabValue: string) => () => void
  claimPanelValue: (panelValue: string) => () => void
  registerTab: (tabValue: string, entry: TabsTabEntry) => () => void
  registerPanel: (panelValue: string, entry: TabsPanelEntry) => () => void
  registerList: () => () => void
  getTabId: (tabValue: string) => string | undefined
  getPanelId: (panelValue: string) => string | undefined
  hasTab: (tabValue: string) => boolean
  hasPanel: (panelValue: string) => boolean
  notePanelFocus: (panelValue: string) => void
  noteTabFocus: (tabValue: string) => void
}

export const TabsContext = React.createContext<TabsContextValue | null>(null)
