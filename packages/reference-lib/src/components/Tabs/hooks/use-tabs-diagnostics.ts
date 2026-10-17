/**
 * Tabs' structural diagnostics: one List and one Tab/Panel pair per
 * value, verified per commit in dev. Takes the registry version, list
 * count, and live entries; warns the exact mismatch and stays silent
 * on empty trees so async anatomy resolving never false-positives.
 * Dangling ARIA is prevented separately at render by the parts.
 */
import * as React from 'react'
import { isDevelopment } from '../../../core/env/dev'
import type { TabsPanelEntry, TabsTabEntry } from '../context'
import { warnTabs } from '../shared/warn'

export function useTabsDiagnostics({ registryVersion, listCount, tabEntries, panelEntries, listCountRef }: {
  registryVersion: number
  listCount: number
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
  panelEntries: React.RefObject<Map<string, TabsPanelEntry>>
  listCountRef: React.RefObject<number>
}) {
// Structural diagnostics (TB-DOM-13): one List and one Tab/Panel pair
  // per value, verified per commit in dev. An empty tree stays silent
  // (async anatomy resolving must never false-positive); anything
  // mounted but unpaired names the exact mismatch. Dangling ARIA is
  // prevented at render (Tab/Panel omit the reference when the live
  // registry lacks the counterpart on the client).
  React.useEffect(() => {
    if (!isDevelopment()) return
    const tabs = Array.from(tabEntries.current.keys())
    const panels = Array.from(panelEntries.current.keys())
    if (tabs.length === 0 && panels.length === 0) return
    const liveListCount = listCountRef.current
    if (liveListCount === 0) {
      warnTabs(
        'renders Tab/Panel parts with no Tabs.List. Render exactly one Tabs.List so keyboard movement and the tab stop exist.'
      )
    } else if (liveListCount > 1) {
      warnTabs(
        `renders ${liveListCount} Tabs.List parts. Render exactly one List per Tabs.`
      )
    }
    const panelSet = new Set(panels)
    for (const tabValue of tabs) {
      if (!panelSet.has(tabValue)) {
        warnTabs(
          `Tab value "${tabValue}" has no matching Panel. Render one Panel per Tab value.`
        )
      }
    }
    const tabSet = new Set(tabs)
    for (const panelValue of panels) {
      if (!tabSet.has(panelValue)) {
        warnTabs(
          `Panel value "${panelValue}" has no matching Tab. Render one Tab per Panel value.`
        )
      }
    }
  }, [registryVersion, listCount])
}
