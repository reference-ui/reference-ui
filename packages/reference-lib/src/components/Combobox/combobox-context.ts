import * as React from 'react'
import type { VirtualFocusAdapter } from '../Listbox'

export interface ComboboxOptionEntry {
  value: string
  id: string
  node: HTMLElement | null
  disabled?: boolean
  textValue?: string
  /**
   * Logical index for VirtualItem mounts (#5). Built-in Listbox options
   * register without one, which is how the ADAPTER-08 two-authority check
   * tells a grid mount from a nested-collection mount.
   */
  index?: number
}

/**
 * Inline-completion policy (#1, W-24). Mirrors `aria-autocomplete` on the
 * Input verbatim (`inline` is a valid ARIA 1.2 token). `inline` and `both`
 * share completion mechanics (complete + select remainder); the token tells
 * AT whether a list is also presented.
 */
export type ComboboxAutocomplete = 'none' | 'inline' | 'list' | 'both'

export type VirtualFocusNavigationKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown'

export interface VirtualFocusNavigationRequest {
  key: VirtualFocusNavigationKey
  currentIndex: number | null
  direction: 'ltr' | 'rtl'
}

/**
 * Grid adapter (#5, Combobox.md Proposed API). `items` is the complete
 * logical reading order; values are unique and `textValue` drives
 * typeahead. `getNextIndex` supplies grid topology; a returned index
 * must be in range and enabled, or null for no move.
 */
export interface ComboboxGridAdapter extends VirtualFocusAdapter {
  role: 'grid'
  getNextIndex(request: VirtualFocusNavigationRequest): number | null
}

/** Mount record for a VirtualItem cell (#5). */
export interface ComboboxVirtualEntry {
  index: number
  value: string
  id: string
  node: HTMLElement | null
  disabled: boolean
}

/**
 * Where the current active value came from (#9). `keyboard` marks fresh
 * keyboard intent (arrows, typeahead, Home/End, typing) and is the only
 * source Tab may commit; `pointer` marks hover/focus preview, cleared by
 * leave; `null` means no derivable source (initial selection, cleared).
 */
export type ComboboxActiveSource = 'keyboard' | 'pointer' | null

export interface ComboboxContextValue {
  value: string | null
  inputValue: string
  isOpen: boolean
  disabled: boolean
  /** True when the focus source is Trigger (select-only): no text authority. */
  selectOnly: boolean
  /** Blur policy (#3): false preserves open/text state on blur. */
  closeOnBlur: boolean
  /** Inline-completion policy (#1, default `list`). */
  autocomplete: ComboboxAutocomplete
  /**
   * Custom-value policy (#2, W-24, Ark-exact name). `true` commits exact
   * unmatched text as the value on Enter/Tab/blur; `false` reverts.
   */
  allowCustomValue: boolean
  /** Granular cancelable Escape hook (#7, Overlay #3 vocabulary). */
  onEscape?: (event: KeyboardEvent) => void
  /**
   * Content gate (#10): true when an authored Popover carries
   * logically non-empty collection content. Read from authored children
   * + collection metadata, so it holds while closed (Overlay #4 non-goal).
   */
  hasPopoverContent: boolean
  /**
   * Effective grid adapter (#5): the authored `virtualFocus` adapter, or
   * null when absent or when a two-authority conflict ignores it
   * (CB-ADAPTER-08). Null does not mean "no collection" — a nested
   * Listbox keeps working through the mounted registry.
   */
  virtualAdapter: ComboboxGridAdapter | null
  /** Requested-but-unmounted logical target (#5 mount timing). */
  pendingVirtualIndex: number | null
  /**
   * Key navigation through the grid adapter (#5). Validates the
   * `getNextIndex` result, activates mounted targets, and pends +
   * `scrollToIndex` for unmounted ones. No-op without an adapter.
   */
  navigateVirtual: (key: VirtualFocusNavigationKey) => void
  /**
   * Prefix search over logical adapter items (#5, CB-ADAPTER-07).
   * Activates mounted matches, pends + scrolls to unmounted ones,
   * clears active when nothing matches. No-op without an adapter.
   */
  searchVirtual: (text: string) => void
  /**
   * Logical-target activation (#5): validates the index, activates
   * mounted targets with keyboard source, and pends + `scrollToIndex`
   * for unmounted ones. Backs `navigateVirtual`, grid typeahead, and
   * the open resolver. No-op without an adapter.
   */
  requestVirtualIndex: (index: number) => void
  /**
   * Popup collection role (#5/DOM mapping): `grid` with an effective
   * adapter, `tree` for a sole authored Tree popup, else `listbox`.
   * Drives focus-source `aria-haspopup` and Popover role derivation.
   */
  popupRole: 'listbox' | 'tree' | 'grid'
  /**
   * Two-authority conflict (#5, CB-ADAPTER-08): authored `virtualFocus`
   * plus a nested collection, or two built-in collections. Active sets
   * and commits are inert while set; a single-authority rerender
   * recovers. Render-time authored signal (diagnosed, not chosen).
   */
  collectionConflict: boolean
  /** VirtualItem mount registration (#5, validates + resolves pending). */
  registerVirtualItem: (entry: ComboboxVirtualEntry) => () => void
  /** Pointer preview on a mounted cell (#5, validates + source-tags). */
  previewVirtualItem: (index: number) => void
  /** Click/tap commit on a mounted cell (#5, validates). */
  commitVirtualItem: (index: number) => void
  setIsOpen: (open: boolean) => void
  /** Closed-source arrow open (#8, CB-OPEN-02): captures direction so the open effect can pend first/last enabled when no selection is valid. */
  requestArrowOpen: (direction: 1 | -1) => void
  handleSelect: (val: string | null) => void
  handleInputChange: (val: string) => void
  /** Outside-focus commit-or-revert + dismissal (#3, #13). */
  handleSourceBlur: (relatedTarget: EventTarget | null) => void
  sourceRef: React.MutableRefObject<HTMLElement | null>
  activeValue: string | null
  activeSource: ComboboxActiveSource
  /**
   * Source-tagged active setter (#9). Defaults to `pointer` so Listbox
   * hover/focus call sites need no change. A non-keyboard request for the
   * committed value while keyboard-active is ignored (leave-restore), so
   * Listbox root leave cannot clobber keyboard intent.
   */
  setActiveValue: (val: string | null, source?: 'keyboard' | 'pointer' | null) => void
  /** Leave path (#9): reverts pointer-derived active to the committed value; keyboard-derived survives. */
  clearPointerActive: () => void
  activeOptionId: string | null
  /**
   * Mounted active option's display label (#1 completion). Null without
   * a mounted active option; resolved next to the active ID so the Input
   * never reads the registry during render.
   */
  activeOptionText: string | null
  registerOption: (entry: ComboboxOptionEntry) => () => void
  getOrderedOptions: () => ComboboxOptionEntry[]
  popoverId: string
  registerFocusSource: (type: 'input' | 'trigger') => () => void
  registerPopover: (id?: string) => () => void
  revertToCommittedText: () => void
  /**
   * Unmatched-text session resolution (#2, W-24). With `allowCustomValue`
   * commits exact text (empty maps to `null`); otherwise restores committed
   * text. Silent when the text already matches the committed value.
   * Select-only and two-authority conflicts resolve to no-ops.
   */
  resolveUnmatchedText: () => void
}

export const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

/**
 * PATCHES #1 (CB-ENV-03): the popover's portal destination follows the
 * focus source. A source inside an open ShadowRoot keeps its popover in
 * that same root; light-DOM sources (and SSR, where ShadowRoot is
 * undefined) keep the default body destination.
 */
export function shadowContainerForSource(
  source: { getRootNode?: () => Node } | null | undefined
): ShadowRoot | undefined {
  const root = source?.getRootNode?.()
  if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
    return root
  }
  return undefined
}
