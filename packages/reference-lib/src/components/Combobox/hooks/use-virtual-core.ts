/**
 * Combobox's logical driver core (#5 + CB-VIRT): index activation with
 * mount/p pending timing, key navigation (grid topology via
 * `getNextIndex`, windowed lists via 1-D stepping), and prefix search
 * over logical items. Mounted targets activate with keyboard source;
 * unmounted ones pend and scroll. No-op without an adapter. Cell
 * registration, preview, and commit live in the cells hook behind the
 * commit callback.
 */
import * as React from 'react'
import {
  currentVirtualIndex,
  directionForElement,
  edgeWindowedIndex,
  findVirtualMatch,
  stepWindowedIndex,
  validateVirtualTarget,
} from '../virtual-focus'
import { comboboxDiagnostic } from '../shared/diagnostic'
import type { VirtualFocusNavigationKey } from '../combobox-context'
import type { ComboboxSession } from './use-combobox-session'

export interface VirtualCore {
  requestVirtualIndex: (index: number) => void
  navigateVirtual: (key: VirtualFocusNavigationKey) => void
  searchVirtual: (text: string) => void
}

export function useVirtualCore(
  session: ComboboxSession,
  setActiveValue: (val: string | null, source?: 'keyboard' | 'pointer' | null) => void
): VirtualCore {
  const {
    adapterRef,
    windowedRef,
    virtualMapRef,
    optionsMapRef,
    pendingVirtualRef,
    setPendingVirtualIndex,
    sourceRef,
    activeValue,
  } = session

  // Logical-target activation (#5 + CB-VIRT): validates the index,
  // activates mounted targets with keyboard source, and pends +
  // `scrollToIndex` for unmounted ones. Active value tracks the logical
  // target either way; the ID publishes only after mount (registry
  // lookup). Grid cells resolve through the VirtualItem map, windowed
  // Listbox targets through the option registry the window populates.
  // No-op without an adapter (absent, malformed, duplicate, conflicted).
  const requestVirtualIndex = React.useCallback(
    (index: number) => {
      const grid = adapterRef.current
      const windowed = windowedRef.current
      const adapter = grid ?? windowed
      if (!adapter) return
      if (validateVirtualTarget(adapter.items, index) !== 'ok') {
        comboboxDiagnostic(
          `Combobox logical target index ${index} is out of range or disabled. Ignored; it cannot become active.`
        )
        return
      }
      const target = adapter.items[index]
      if (!target) return
      const mountedNode = windowed
        ? (optionsMapRef.current.get(target.value)?.node ?? null)
        : (virtualMapRef.current.get(index)?.node ?? null)
      const mountedValueMatches = windowed
        ? optionsMapRef.current.get(target.value)?.node?.isConnected === true
        : virtualMapRef.current.get(index)?.value === target.value &&
          virtualMapRef.current.get(index)?.node?.isConnected === true
      if (mountedNode && mountedValueMatches) {
        pendingVirtualRef.current = null
        setPendingVirtualIndex(null)
        setActiveValue(target.value, 'keyboard')
        mountedNode.scrollIntoView({ block: 'nearest' })
        return
      }
      const pending = pendingVirtualRef.current
      if (pending && pending.index === index && pending.value === target.value) return
      pendingVirtualRef.current = { index, value: target.value }
      setPendingVirtualIndex(index)
      setActiveValue(target.value, 'keyboard')
      adapter.scrollToIndex(index)
    },
    [setActiveValue]
  )

  // Key navigation through the logical adapter (#5 + CB-VIRT). Grids own
  // topology via `getNextIndex`; windowed lists step 1-D (arrows wrap,
  // Home/End edge, page/horizontal keys have no contract and stay put).
  // Null (no move) is valid; invalid results diagnose via
  // requestVirtualIndex.
  const navigateVirtual = React.useCallback(
    (key: VirtualFocusNavigationKey) => {
      const grid = adapterRef.current
      const windowed = windowedRef.current
      if (grid) {
        const next = grid.getNextIndex({
          key,
          currentIndex: currentVirtualIndex(grid.items, activeValue),
          direction: directionForElement(sourceRef.current),
        })
        if (next == null) return
        requestVirtualIndex(next)
        return
      }
      if (windowed) {
        const current = currentVirtualIndex(windowed.items, activeValue)
        let next: number | null = null
        if (key === 'ArrowDown') {
          next = stepWindowedIndex({ items: windowed.items, currentIndex: current, direction: 1 })
        } else if (key === 'ArrowUp') {
          next = stepWindowedIndex({ items: windowed.items, currentIndex: current, direction: -1 })
        } else if (key === 'Home') {
          next = edgeWindowedIndex(windowed.items, 'first')
        } else if (key === 'End') {
          next = edgeWindowedIndex(windowed.items, 'last')
        } else {
          return
        }
        if (next == null) return
        requestVirtualIndex(next)
      }
    },
    [activeValue, requestVirtualIndex]
  )

  // Prefix search over logical adapter items (#5, CB-ADAPTER-07; CB-VIRT
  // shares it for windowed typing/typeahead).
  const searchVirtual = React.useCallback(
    (text: string) => {
      const adapter = adapterRef.current ?? windowedRef.current
      if (!adapter) return
      const match = findVirtualMatch(adapter.items, text)
      if (match == null) {
        setActiveValue(null)
      } else {
        requestVirtualIndex(match)
      }
    },
    [requestVirtualIndex, setActiveValue]
  )

  return { requestVirtualIndex, navigateVirtual, searchVirtual }
}
