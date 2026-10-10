/**
 * Listbox's session: every ref and state cell the behavior hooks share —
 * the option registry, render-time identity map, roving focus and pending
 * virtual target, typeahead buffer and timer, collator, and container
 * node. It also runs the controlled-value reset effect first, so focus
 * clears whenever the parent takes selection elsewhere (LB-SINGLE-07).
 * Behavior hooks take the session and add decisions; nothing else owns
 * listbox state.
 */
import * as React from 'react'
import type { ListboxVirtualAdapter, OptionRecord } from '../types'

export interface ListboxSession {
  optionsMapRef: React.MutableRefObject<Map<string, OptionRecord>>
  renderValuesMapRef: React.MutableRefObject<Map<string, string>>
  virtualRef: React.MutableRefObject<ListboxVirtualAdapter | undefined>
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  typeaheadBufferRef: React.MutableRefObject<string>
  typeaheadTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  lastOrderedValuesRef: React.MutableRefObject<string[]>
  optionsVersion: number
  setOptionsVersion: React.Dispatch<React.SetStateAction<number>>
  focusedValue: string | null
  setFocusedValue: React.Dispatch<React.SetStateAction<string | null>>
  pendingVirtualIndex: number | null
  setPendingVirtualIndex: React.Dispatch<React.SetStateAction<number | null>>
  collator: Intl.Collator
}

export function useListboxSession(valueProp: unknown): ListboxSession {
  const optionsMapRef = React.useRef<Map<string, OptionRecord>>(new Map())
  const [optionsVersion, setOptionsVersion] = React.useState(0)
  const [focusedValue, setFocusedValue] = React.useState<string | null>(null)
  const [pendingVirtualIndex, setPendingVirtualIndex] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Reset focusedValue when controlled value updates (LB-SINGLE-07)
  React.useEffect(() => {
    setFocusedValue(null)
  }, [valueProp])

  const renderValuesMapRef = React.useRef<Map<string, string>>(new Map())
  const virtualRef = React.useRef<ListboxVirtualAdapter | undefined>(undefined)
  const typeaheadBufferRef = React.useRef('')
  const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastOrderedValuesRef = React.useRef<string[]>([])
  const collator = React.useMemo(
    () => new Intl.Collator(undefined, { sensitivity: 'accent', usage: 'search' }),
    []
  )

  // LB-VIRT-10: no unmount cleanup needed — the pending virtual target is
  // plain component state, so unmount discards it inherently. (A setState
  // cleanup here would warn on React 17; there is no timer or rAF to kill.)

  return {
    optionsMapRef,
    renderValuesMapRef,
    virtualRef,
    containerRef,
    typeaheadBufferRef,
    typeaheadTimerRef,
    lastOrderedValuesRef,
    optionsVersion,
    setOptionsVersion,
    focusedValue,
    setFocusedValue,
    pendingVirtualIndex,
    setPendingVirtualIndex,
    collator,
  }
}
