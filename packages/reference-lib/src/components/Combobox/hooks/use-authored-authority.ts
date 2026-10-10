/**
 * Combobox's authored authority: the render-time scan of authored
 * children into the content gate, the grid and windowed adapters, and
 * the single-authority resolution. Closed popovers unmount, so the gate
 * reads authored children plus collection metadata, never the live DOM
 * (Overlay #4 non-goal). Conflicts, malformed adapters, duplicate
 * values, nested onChange, and multiple selection all diagnose at
 * render; the affected paths stay inert until exactly one authority
 * remains. Render order never chooses.
 */
import * as React from 'react'
import type { VirtualFocusAdapter } from '../../Listbox'
import {
  isGridAdapter,
  isWindowedListAdapter,
  scanAuthoredCollections,
  scanHasPopoverContent,
  type AuthoredCollectionRefs,
  type AuthoredCollectionScan,
} from '../authored'
import type { ComboboxGridAdapter } from '../combobox-context'
import { comboboxDiagnostic } from '../shared/diagnostic'
import { findDuplicateValue } from '../virtual-focus'
import type { ComboboxSession } from './use-combobox-session'

export interface AuthoredAuthority {
  authoredScan: AuthoredCollectionScan
  hasPopoverContent: boolean
  virtualAdapter: ComboboxGridAdapter | null
  windowedListAdapter: VirtualFocusAdapter | null
  popupRole: 'listbox' | 'tree' | 'grid'
  collectionConflict: boolean
}

export function useAuthoredAuthority(
  session: ComboboxSession,
  children: React.ReactNode,
  onChange: (value: string | null) => void,
  refs: AuthoredCollectionRefs
): AuthoredAuthority {
  const { adapterRef, windowedRef, pendingVirtualRef, setPendingVirtualIndex } = session

  // Authored-children inspection (#10 content gate + #5 adapter /
  // ADAPTER-02/03/08 diagnostics). Closed popovers unmount, so the gate
  // reads authored children + collection metadata, never the live DOM
  // (Overlay #4 non-goal). Render-time: children updates rescan.
  const authoredScan = React.useMemo(
    () => scanAuthoredCollections(children, refs, onChange != null),
    [children, onChange]
  )
  const hasPopoverContent = scanHasPopoverContent(authoredScan)

  const authoredAdapter: ComboboxGridAdapter | null = isGridAdapter(
    authoredScan.virtualFocusAdapter
  )
    ? (authoredScan.virtualFocusAdapter as ComboboxGridAdapter)
    : null
  if (authoredScan.virtualFocusAdapter != null && authoredAdapter == null) {
    comboboxDiagnostic(
      'Combobox.Popover virtualFocus must be a grid adapter (role "grid" with items, getNextIndex, scrollToIndex). The value is ignored.'
    )
  }
  const duplicateValue = authoredAdapter
    ? findDuplicateValue(authoredAdapter.items)
    : null
  if (duplicateValue != null) {
    comboboxDiagnostic(
      `Combobox virtualFocus items must have unique values. Duplicate: "${duplicateValue}". The adapter is ignored until values are unique.`
    )
  }

  // Single-authority resolution (#5, CB-ADAPTER-08): authored
  // virtualFocus plus a nested collection, or two built-in collections,
  // diagnose and leave every collection path inert until exactly one
  // authority remains. Render order never chooses.
  const authoredKinds = authoredScan.collectionKinds
  const collectionConflict =
    (authoredAdapter != null && authoredKinds.length > 0) || authoredKinds.length > 1
  if (collectionConflict) {
    const authorities =
      authoredAdapter != null
        ? ['virtualFocus', ...authoredKinds]
        : authoredKinds
    comboboxDiagnostic(
      `Combobox.Popover must resolve exactly one collection authority; found ${authorities.join(' + ')}. Neither drives navigation, active state, scroll, or commit until exactly one remains.`
    )
  }
  if (authoredScan.nestedOnChangeKind != null) {
    comboboxDiagnostic(
      `Combobox owns commit authority: a nested ${authoredScan.nestedOnChangeKind} must not carry its own onChange. Remove it; root onChange is the sole commit callback.`
    )
  }
  if (authoredScan.multipleListbox) {
    comboboxDiagnostic(
      'Combobox commit contract is scalar: a nested multiple-selection Listbox is incompatible. Use single selection (chips are a Field composition).'
    )
  }

  const virtualAdapter =
    collectionConflict || duplicateValue != null ? null : authoredAdapter
  // Windowed-Listbox driver (CB-VIRT-*): the nested Listbox's own
  // `virtual` prop, engaged only as the sole unconflicted authority.
  // This is Listbox-internal metadata, so a malformed value diagnoses
  // and falls back to mounted-only navigation rather than breaking the
  // collection. Never coexists with the grid adapter (that combination
  // is already a CB-ADAPTER-08 conflict above).
  const authoredWindowed = isWindowedListAdapter(authoredScan.listboxVirtualAdapter)
    ? (authoredScan.listboxVirtualAdapter as VirtualFocusAdapter)
    : null
  if (authoredScan.listboxVirtualAdapter != null && authoredWindowed == null) {
    comboboxDiagnostic(
      'Combobox ignores a nested Listbox virtual prop that is not a windowed adapter (items array with scrollToIndex). Mounted-only navigation applies.'
    )
  }
  const soleListboxKind =
    authoredKinds.length === 1 && authoredKinds[0] === 'listbox'
  const windowedListAdapter =
    collectionConflict || virtualAdapter != null || !soleListboxKind
      ? null
      : authoredWindowed
  // Live adapters for registration-time callbacks (refs: mounts must not
  // re-subscribe when the adapter object identity changes).
  adapterRef.current = virtualAdapter
  windowedRef.current = windowedListAdapter

  // Metadata replacement/reorder cancels stale mount requests; identity
  // follows the items array so inline adapter wrappers stay harmless.
  // Windowed lists share the pending slot (CB-VIRT-02) — only one driver
  // engages at a time, so one slot cannot mix authorities.
  const adapterItems = virtualAdapter?.items
  const windowedItems = windowedListAdapter?.items
  React.useEffect(() => {
    pendingVirtualRef.current = null
    setPendingVirtualIndex(null)
  }, [adapterItems, windowedItems])

  const popupRole: 'listbox' | 'tree' | 'grid' = virtualAdapter
    ? 'grid'
    : authoredKinds.length === 1 && authoredKinds[0] === 'tree'
      ? 'tree'
      : 'listbox'

  return {
    authoredScan,
    hasPopoverContent,
    virtualAdapter,
    windowedListAdapter,
    popupRole,
    collectionConflict,
  }
}
