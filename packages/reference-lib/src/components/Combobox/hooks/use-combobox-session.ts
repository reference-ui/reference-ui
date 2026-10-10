/**
 * Combobox's session: every ref and state cell the behavior hooks share —
 * controlled input/open state, active value and source, the option and
 * label registries, the virtual maps and pending slots, source/popover
 * accounting, and the resolution cursors. It also re-arms the open-request
 * and commit refs on every settled render so gestures dedupe within one
 * task but programmatic changes stay actionable. Behavior hooks take the
 * session and add decisions; nothing else owns combobox state.
 */
import * as React from 'react'
import type {
  ComboboxActiveSource,
  ComboboxGridAdapter,
  ComboboxOptionEntry,
  ComboboxVirtualEntry,
} from '../combobox-context'
import type { VirtualFocusAdapter } from '../../Listbox'
import { sanitizeComboboxId } from '../shared/ids'

export interface ComboboxSession {
  isControlledInput: boolean
  inputValue: string
  setInternalInput: React.Dispatch<React.SetStateAction<string>>
  isControlledOpen: boolean
  isOpen: boolean
  setInternalOpen: React.Dispatch<React.SetStateAction<boolean>>
  activeValue: string | null
  activeSource: ComboboxActiveSource
  setActiveValueState: React.Dispatch<React.SetStateAction<string | null>>
  setActiveSourceState: React.Dispatch<React.SetStateAction<ComboboxActiveSource>>
  activeSourceRef: React.MutableRefObject<ComboboxActiveSource>
  sourceRef: React.MutableRefObject<HTMLElement | null>
  popoverId: string
  setPopoverId: React.Dispatch<React.SetStateAction<string>>
  focusSourcesCountRef: React.MutableRefObject<number>
  popoverCountRef: React.MutableRefObject<number>
  pendingDirectionRef: React.MutableRefObject<1 | -1 | null>
  pendingTypingRef: React.MutableRefObject<boolean>
  optionsMapRef: React.MutableRefObject<Map<string, ComboboxOptionEntry>>
  labelCacheRef: React.MutableRefObject<Map<string, string>>
  optionsVersion: number
  setOptionsVersion: React.Dispatch<React.SetStateAction<number>>
  adapterRef: React.MutableRefObject<ComboboxGridAdapter | null>
  windowedRef: React.MutableRefObject<VirtualFocusAdapter | null>
  virtualMapRef: React.MutableRefObject<Map<number, ComboboxVirtualEntry>>
  pendingVirtualRef: React.MutableRefObject<{ index: number; value: string } | null>
  pendingVirtualIndex: number | null
  setPendingVirtualIndex: React.Dispatch<React.SetStateAction<number | null>>
  focusSourcesRef: React.MutableRefObject<Set<'input' | 'trigger'>>
  lastOpenRequestRef: React.MutableRefObject<boolean>
  justCommittedRef: React.MutableRefObject<boolean>
  prevOpenRef: React.MutableRefObject<boolean>
  needsResolveRef: React.MutableRefObject<boolean>
  lastOrderRef: React.MutableRefObject<string[]>
  announcedEmptyRef: React.MutableRefObject<'empty' | 'none' | null>
}

export function useComboboxSession(
  value: string | null,
  inputValProp: string | undefined,
  defaultInputValue: string | undefined,
  openProp: boolean | undefined,
  defaultOpen: boolean
): ComboboxSession {
  const isControlledInput = inputValProp !== undefined
  const [internalInput, setInternalInput] = React.useState<string>(
    () => defaultInputValue ?? (value ? String(value) : '')
  )
  const inputValue = isControlledInput ? inputValProp : internalInput

  const isControlledOpen = openProp !== undefined
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
  const isOpen = isControlledOpen ? openProp : internalOpen
  const sourceRef = React.useRef<HTMLElement | null>(null)

  const rawDefaultPopoverId = React.useId()
  const [popoverId, setPopoverId] = React.useState<string>(() =>
    sanitizeComboboxId(rawDefaultPopoverId)
  )
  const focusSourcesCountRef = React.useRef(0)
  const popoverCountRef = React.useRef(0)

  const [activeValue, setActiveValueState] = React.useState<string | null>(value ?? null)
  const [activeSource, setActiveSourceState] = React.useState<ComboboxActiveSource>(null)
  const activeSourceRef = React.useRef<ComboboxActiveSource>(null)
  // Opening direction captured by closed-source arrows (#8, CB-OPEN-02):
  // with no valid selection, Down pends first enabled, Up pends last.
  const pendingDirectionRef = React.useRef<1 | -1 | null>(null)
  // Typing while the mounted registry is empty (closed popover, or zero
  // options) pends the typing rule: the resolver activates the first
  // enabled match once options mount, so fast closed typing is not a
  // commit-timing race (CB-MODE-03/04 determinism). Grids resolve live
  // (logical items need no mount) and never need this flag.
  const pendingTypingRef = React.useRef(false)
  const optionsMapRef = React.useRef<Map<string, ComboboxOptionEntry>>(new Map())
  // Label cache (#1 composition): revert restores the committed label
  // even after filtering unmounts the option. Entries survive unmount
  // (overwrite on re-register); values never mounted still fall back
  // to the raw value (CB-COMMIT-05).
  const labelCacheRef = React.useRef<Map<string, string>>(new Map())
  // Registration mutates the map (no render on its own), so each
  // register/unregister also bumps a version to recompute the mounted-only
  // active ID. The bump carries no data — the map is still the source.
  const [optionsVersion, setOptionsVersion] = React.useState(0)

  // Live adapters for registration-time callbacks (refs: mounts must not
  // re-subscribe when the adapter object identity changes).
  const adapterRef = React.useRef<ComboboxGridAdapter | null>(null)
  const windowedRef = React.useRef<VirtualFocusAdapter | null>(null)
  const virtualMapRef = React.useRef(new Map<number, ComboboxVirtualEntry>())
  // Requested-but-unmounted logical target (#5 mount timing). Identity
  // is index + value so stale mounts after metadata replacement can
  // never publish (CB-ADAPTER-07).
  const pendingVirtualRef = React.useRef<{ index: number; value: string } | null>(null)
  const [pendingVirtualIndex, setPendingVirtualIndex] = React.useState<number | null>(null)

  // #13: the registered focus-source type decides select-only mode.
  // Under the exactly-one-source invariant last-wins is exact.
  const focusSourcesRef = React.useRef(new Set<'input' | 'trigger'>())

  // Last requested open state. Collapses duplicate requests inside one
  // gesture — Overlay's deferred click-dismiss after a blur-dismiss, Tab
  // commit followed by blur, CB-OPEN-03 open spam while the parent stays
  // closed — and re-arms on every settled render so programmatic prop
  // changes stay callback-free (CB-OPEN-06) yet actionable afterwards.
  const lastOpenRequestRef = React.useRef<boolean>(isOpen)
  // F11 (SCOPE-1): Tab commits synchronously record here so a same-task
  // blur (Firefox runs Tab→blur before React flushes, D2 family) skips
  // the already-resolved session instead of reverting against stale
  // value/input state. Re-arms on every settled render, like the open
  // request ref above, so later blurs resolve normally.
  const justCommittedRef = React.useRef<boolean>(false)
  React.useEffect(() => {
    lastOpenRequestRef.current = isOpen
    justCommittedRef.current = false
  })

  const prevOpenRef = React.useRef(false)
  const needsResolveRef = React.useRef(false)
  const lastOrderRef = React.useRef<string[]>([])
  const announcedEmptyRef = React.useRef<'empty' | 'none' | null>(null)

  return {
    isControlledInput,
    inputValue,
    setInternalInput,
    isControlledOpen,
    isOpen,
    setInternalOpen,
    activeValue,
    activeSource,
    setActiveValueState,
    setActiveSourceState,
    activeSourceRef,
    sourceRef,
    popoverId,
    setPopoverId,
    focusSourcesCountRef,
    popoverCountRef,
    pendingDirectionRef,
    pendingTypingRef,
    optionsMapRef,
    labelCacheRef,
    optionsVersion,
    setOptionsVersion,
    adapterRef,
    windowedRef,
    virtualMapRef,
    pendingVirtualRef,
    pendingVirtualIndex,
    setPendingVirtualIndex,
    focusSourcesRef,
    lastOpenRequestRef,
    justCommittedRef,
    prevOpenRef,
    needsResolveRef,
    lastOrderRef,
    announcedEmptyRef,
  }
}
