import * as React from 'react'

export interface ComboboxOptionEntry {
  value: string
  id: string
  node: HTMLElement | null
  disabled?: boolean
  textValue?: string
}

export interface ComboboxContextValue {
  value: string | null
  inputValue: string
  isOpen: boolean
  disabled: boolean
  setIsOpen: (open: boolean) => void
  handleSelect: (val: string | null) => void
  handleInputChange: (val: string) => void
  sourceRef: React.MutableRefObject<HTMLElement | null>
  activeValue: string | null
  setActiveValue: (val: string | null) => void
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
