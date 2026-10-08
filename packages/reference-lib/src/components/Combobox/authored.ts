import * as React from 'react'

/**
 * Authored-children inspection for Combobox (#10 content gate, CB-ADAPTER-02/03/08
 * diagnostics). Overlay #4 resolved closed-content observation as a non-goal:
 * coordinators answer from authored children plus collection metadata above
 * the mount, because unmount-when-closed keeps the popover unmounted while
 * closed. This module is the Combobox half of that contract.
 *
 * Element-type refs are caller-supplied so this module stays dependency-free
 * (no import cycle with Combobox.tsx). Fragments and arrays are transparent;
 * wrapped popovers/collections (HOCs obscuring the element type) are out of
 * contract and read as absent — direct authorship is the documented shape.
 */

export interface AuthoredCollectionRefs {
  Popover: React.ElementType
  ComboboxOption: React.ElementType
  ListboxOption: React.ElementType
  VirtualItem: React.ElementType
  Listbox: React.ElementType
  Tree: React.ElementType
  TreeItem: React.ElementType
  Empty: React.ElementType
}

export type AuthoredCollectionKind = 'listbox' | 'tree'

export interface AuthoredCollectionScan {
  /** Authored Popover elements (fragments/arrays transparent). */
  popovers: React.ReactElement[]
  /**
   * First authored `virtualFocus` prop (#5). Untyped here so this module
   * stays dependency-free; the caller narrows to its grid adapter.
   */
  virtualFocusAdapter: unknown
  /** Logical item count from adapter metadata (grid + windowed Listbox). */
  metadataItemCount: number
  /**
   * First nested Listbox `virtual` prop (CB-VIRT driver). Untyped here so
   * this module stays dependency-free; the caller narrows to its windowed
   * adapter. Part of the Listbox authority, never a second one.
   */
  listboxVirtualAdapter: unknown
  /** An Empty element is authored under any Popover (FEATURES #4). */
  emptyAuthored: boolean
  /** Option/VirtualItem/TreeItem elements authored under any Popover. */
  authoredItemCount: number
  /** Built-in collection roots under any Popover, deduped in order. */
  collectionKinds: AuthoredCollectionKind[]
  /** A nested collection carries its own onChange (CB-ADAPTER-02). */
  nestedOnChangeKind: AuthoredCollectionKind | null
  /** A nested Listbox uses selection="multiple" (CB-ADAPTER-03). */
  multipleListbox: boolean
}

function metadataLength(value: unknown): number {
  if (typeof value !== 'object' || value === null) return 0
  const items = (value as { items?: unknown }).items
  return Array.isArray(items) ? items.length : 0
}

export function scanAuthoredCollections(
  children: React.ReactNode,
  refs: AuthoredCollectionRefs,
  rootHasOnChange: boolean
): AuthoredCollectionScan {
  const scan: AuthoredCollectionScan = {
    popovers: [],
    virtualFocusAdapter: undefined,
    metadataItemCount: 0,
    listboxVirtualAdapter: undefined,
    emptyAuthored: false,
    authoredItemCount: 0,
    collectionKinds: [],
    nestedOnChangeKind: null,
    multipleListbox: false,
  }

  const recordKind = (kind: AuthoredCollectionKind) => {
    if (!scan.collectionKinds.includes(kind)) scan.collectionKinds.push(kind)
  }

  const visit = (nodes: React.ReactNode, inPopover: boolean): void => {
    React.Children.forEach(nodes, child => {
      if (!React.isValidElement(child)) return
      const type = child.type as React.ElementType
      const props = (child.props ?? {}) as Record<string, unknown>

      if (type === refs.Popover) {
        scan.popovers.push(child)
        if (scan.virtualFocusAdapter === undefined && props.virtualFocus != null) {
          scan.virtualFocusAdapter = props.virtualFocus
        }
        scan.metadataItemCount += metadataLength(props.virtualFocus)
        visit(props.children as React.ReactNode, true)
        return
      }
      if (!inPopover) {
        visit(props.children as React.ReactNode, false)
        return
      }
      // Inside a Popover below this line.
      if (type === refs.Empty) {
        scan.emptyAuthored = true
        return
      }
      if (type === refs.Listbox) {
        recordKind('listbox')
        if (rootHasOnChange && props.onChange != null) scan.nestedOnChangeKind = 'listbox'
        if (props.selection === 'multiple') scan.multipleListbox = true
        scan.metadataItemCount += metadataLength(props.virtual)
        if (scan.listboxVirtualAdapter === undefined && props.virtual != null) {
          scan.listboxVirtualAdapter = props.virtual
        }
        visit(props.children as React.ReactNode, true)
        return
      }
      if (type === refs.Tree) {
        recordKind('tree')
        if (rootHasOnChange && props.onChange != null && scan.nestedOnChangeKind == null) {
          scan.nestedOnChangeKind = 'tree'
        }
        visit(props.children as React.ReactNode, true)
        return
      }
      if (
        type === refs.ComboboxOption ||
        type === refs.ListboxOption ||
        type === refs.VirtualItem ||
        type === refs.TreeItem
      ) {
        scan.authoredItemCount += 1
      }
      visit(props.children as React.ReactNode, true)
    })
  }

  visit(children, false)
  return scan
}

/**
 * Content gate (#10, CB-OPEN-03): an edit-triggered open is requested only
 * when an authored Popover exists and its collection is logically
 * non-empty — authored item elements or adapter/window metadata.
 */
export function scanHasPopoverContent(scan: AuthoredCollectionScan): boolean {
  if (scan.popovers.length === 0) return false
  return scan.authoredItemCount > 0 || scan.metadataItemCount > 0
}
