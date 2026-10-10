/**
 * Tabs' identity registry: duplicate-claiming values, value-keyed tab
 * and panel entries subscribed with cleanup, generated-ID fallbacks for
 * SSR, linkage settlement, and the one-List count. Takes nothing,
 * returns the registry object the order, value, diagnostics, and focus
 * hooks all read from. Commit-phase claiming keeps StrictMode and
 * React 17/18 double-render from false-positive duplicates.
 */
import * as React from 'react'
import type { TabsPanelEntry, TabsTabEntry } from '../context'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'

export interface TabsRegistry {
  claimTabValue: (tabValue: string) => () => void
  claimPanelValue: (panelValue: string) => () => void
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
  panelEntries: React.RefObject<Map<string, TabsPanelEntry>>
  registryVersion: number
  registerTab: (tabValue: string, entry: TabsTabEntry) => () => void
  registerPanel: (panelValue: string, entry: TabsPanelEntry) => () => void
  getTabId: (tabValue: string) => string | undefined
  getPanelId: (panelValue: string) => string | undefined
  hasTab: (tabValue: string) => boolean
  hasPanel: (panelValue: string) => boolean
  linkageSettled: boolean
  listCount: number
  listCountRef: React.RefObject<number>
  registerList: () => () => void
}

export function useTabsRegistry(): TabsRegistry {
// Duplicate tracking (TB-DOM-10): value identity is claimed in an
  // effect with cleanup, so StrictMode double-render/double-effects and
  // dynamic add/remove never false-positive. Render-phase claiming
  // breaks under React 17/18 double-render (hook state resets between
  // the two invocations); commit-phase claiming is version-robust.
  const tabValueCounts = React.useRef<Map<string, number>>(new Map())
  const panelValueCounts = React.useRef<Map<string, number>>(new Map())
  const claimTabValue = React.useCallback((tabValue: string) => {
    const counts = tabValueCounts.current
    const next = (counts.get(tabValue) ?? 0) + 1
    counts.set(tabValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Tab value "${tabValue}". Every Tab must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(tabValue) ?? 1) - 1
      if (left <= 0) counts.delete(tabValue)
      else counts.set(tabValue, left)
    }
  }, [])
  const claimPanelValue = React.useCallback((panelValue: string) => {
    const counts = panelValueCounts.current
    const next = (counts.get(panelValue) ?? 0) + 1
    counts.set(panelValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Panel value "${panelValue}". Every Panel must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(panelValue) ?? 1) - 1
      if (left <= 0) counts.delete(panelValue)
      else counts.set(panelValue, left)
    }
  }, [])

// Identity registry (TB-DOM-06, TB-DYNAMIC-01/02): value-keyed Tab and
  // Panel entries subscribed in a layout effect with cleanup, so explicit
  // IDs flow to the other side's ARIA reference and insert/reorder/remove
  // keep surviving IDs stable. The version bump re-renders consumers that
  // read through getTabId/getPanelId; the generated-ID fallback keeps SSR
  // and first render identical to the unregistered state.
  const tabEntries = React.useRef<Map<string, TabsTabEntry>>(new Map())
  const panelEntries = React.useRef<Map<string, TabsPanelEntry>>(new Map())
  const [registryVersion, setRegistryVersion] = React.useState(0)
  const registerTab = React.useCallback(
    (tabValue: string, entry: TabsTabEntry) => {
      tabEntries.current.set(tabValue, entry)
      setRegistryVersion(version => version + 1)
      return () => {
        if (tabEntries.current.get(tabValue) === entry) {
          tabEntries.current.delete(tabValue)
        }
        setRegistryVersion(version => version + 1)
      }
    },
    []
  )
  const registerPanel = React.useCallback(
    (panelValue: string, entry: TabsPanelEntry) => {
      panelEntries.current.set(panelValue, entry)
      setRegistryVersion(version => version + 1)
      return () => {
        if (panelEntries.current.get(panelValue) === entry) {
          panelEntries.current.delete(panelValue)
        }
        setRegistryVersion(version => version + 1)
      }
    },
    []
  )
  const getTabId = React.useCallback(
    (tabValue: string) => tabEntries.current.get(tabValue)?.id,
    []
  )
  const getPanelId = React.useCallback(
    (panelValue: string) => panelEntries.current.get(panelValue)?.id,
    []
  )
  const hasTab = React.useCallback(
    (tabValue: string) => tabEntries.current.has(tabValue),
    []
  )
  const hasPanel = React.useCallback(
    (panelValue: string) => panelEntries.current.has(panelValue),
    []
  )

  // Linkage settlement (TB-ENV-01 vs TB-DOM-13): flips pre-paint on
  // the client (child registry subscriptions run first, so one re-render
  // carries both); never flips in SSR, where layout effects never run.
  const [linkageSettled, setLinkageSettled] = React.useState(false)
  useIsomorphicLayoutEffect(() => {
    setLinkageSettled(true)
  }, [])

  // Mounted List count (TB-DOM-13): exactly one List per Tabs; zero or
  // two-plus is a dev diagnostic, never a crash. The ref mirrors the
  // state synchronously: passive effects of the mount commit flush before
  // subscription setStates re-render, so the state still reads 0 when the
  // diagnostic first runs — the ref reads the settled value.
  const [listCount, setListCount] = React.useState(0)
  const listCountRef = React.useRef(0)
  const registerList = React.useCallback(() => {
    listCountRef.current += 1
    setListCount(count => count + 1)
    return () => {
      listCountRef.current = Math.max(0, listCountRef.current - 1)
      setListCount(count => Math.max(0, count - 1))
    }
  }, [])
  return {
    claimTabValue, claimPanelValue, tabEntries, panelEntries, registryVersion,
    registerTab, registerPanel, getTabId, getPanelId, hasTab, hasPanel,
    linkageSettled, listCount, listCountRef, registerList,
  }
}
