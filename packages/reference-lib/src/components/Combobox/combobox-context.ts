import * as React from 'react'

export interface ComboboxOptionEntry {
  value: string
  id: string
  node: HTMLElement | null
  disabled?: boolean
  textValue?: string
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
  registerOption: (entry: ComboboxOptionEntry) => () => void
  getOrderedOptions: () => ComboboxOptionEntry[]
  popoverId: string
  registerFocusSource: (type: 'input' | 'trigger') => () => void
  registerPopover: (id?: string) => () => void
  revertToCommittedText: () => void
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
