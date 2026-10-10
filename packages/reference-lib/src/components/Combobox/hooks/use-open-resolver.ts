/**
 * Combobox's open resolution: the open-transition effect (fresh opens
 * clear active and defer; value changes while open follow the
 * selection), the resolver that applies the valid selection or pending
 * first/last/typing rule once options register, windowed-mount
 * resolution for the shared pending slot, and dynamic-data active
 * follow with positional-neighbor fallback. Effects keep their original
 * order: transition, resolve, windowed-mount, follow.
 */
import * as React from 'react'
import type { ComboboxOptionEntry } from '../combobox-context'
import type { ComboboxSession } from './use-combobox-session'

export function useOpenResolver(
  session: ComboboxSession,
  args: {
    value: string | null
    inputValue: string
    collectionConflict: boolean
    getOrderedOptions: () => ComboboxOptionEntry[]
    requestVirtualIndex: (index: number) => void
    searchVirtual: (text: string) => void
  }
) {
  const {
    isOpen,
    activeValue,
    setActiveValueState,
    setActiveSourceState,
    activeSourceRef,
    optionsMapRef,
    optionsVersion,
    adapterRef,
    windowedRef,
    pendingVirtualRef,
    setPendingVirtualIndex,
    pendingDirectionRef,
    pendingTypingRef,
    prevOpenRef,
    needsResolveRef,
    lastOrderRef,
  } = session
  const {
    value,
    inputValue,
    collectionConflict,
    getOrderedOptions,
    requestVirtualIndex,
    searchVirtual,
  } = args

  // Fresh opens clear active and defer resolution: Overlay mounts
  // popover content (and option registrations) in a later commit, so the
  // collection reads empty here. The resolver below applies the valid
  // selection or pending first/last once options register.
  React.useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = isOpen
    if (isOpen && !wasOpen) {
      needsResolveRef.current = true
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
    } else if (isOpen) {
      // Value changed while open (CB-NAV-06): follow the selection.
      // Windowed targets that are not mounted pend + scroll exactly like
      // the open resolver (CB-VIRT-03); the source stays null (a
      // programmatic follow, never Tab-eligible keyboard intent).
      const nextVal = value ?? null
      const windowed = windowedRef.current
      if (windowed && nextVal != null) {
        const at = windowed.items.findIndex(
          item => item.value === nextVal && !item.disabled
        )
        if (at !== -1) {
          const node = optionsMapRef.current.get(nextVal)?.node
          if (node?.isConnected) {
            pendingVirtualRef.current = null
            setPendingVirtualIndex(null)
            node.scrollIntoView({ block: 'nearest' })
          } else if (
            pendingVirtualRef.current?.index !== at ||
            pendingVirtualRef.current?.value !== nextVal
          ) {
            pendingVirtualRef.current = { index: at, value: nextVal }
            setPendingVirtualIndex(at)
            windowed.scrollToIndex(at)
          }
          activeSourceRef.current = null
          setActiveSourceState(null)
          setActiveValueState(nextVal)
          return
        }
      }
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(nextVal)
    } else {
      needsResolveRef.current = false
      pendingDirectionRef.current = null
      pendingTypingRef.current = false
      pendingVirtualRef.current = null
      setPendingVirtualIndex(null)
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
    }
  }, [isOpen, value, getOrderedOptions])

  React.useEffect(() => {
    if (!isOpen) return
    if (!needsResolveRef.current && !pendingTypingRef.current) return
    // Conflicted collections stay unresolved (CB-ADAPTER-08); the flag
    // is a dep so single-authority recovery rerenders resolve.
    if (collectionConflict) return
    // Logical open (#5 + CB-VIRT): resolve over logical items —
    // selection wins, else first/last enabled by opening direction.
    // Unmounted targets pend + scroll; no mount wait needed.
    const adapter = adapterRef.current ?? windowedRef.current
    if (adapter) {
      const items = adapter.items
      const committed = value ?? null
      let target: number | null = null
      if (committed != null) {
        const selected = items.findIndex(item => item.value === committed && !item.disabled)
        if (selected !== -1) target = selected
      }
      if (target == null && pendingDirectionRef.current != null) {
        const order =
          pendingDirectionRef.current === 1
            ? items.map((item, at) => ({ item, at }))
            : items.map((item, at) => ({ item, at })).reverse()
        target = order.find(entry => !entry.item.disabled)?.at ?? null
      }
      needsResolveRef.current = false
      pendingDirectionRef.current = null
      if (target != null) {
        pendingTypingRef.current = false
        requestVirtualIndex(target)
      } else if (pendingTypingRef.current) {
        // Deferred grid typing rule: re-apply the prefix search the
        // open effect wiped, against current metadata.
        pendingTypingRef.current = false
        searchVirtual(inputValue)
      } else setActiveValueState(null)
      return
    }
    const enabled = getOrderedOptions().filter(opt => !opt.disabled)
    // Wait for registrations; empty collections settle on null active.
    if (enabled.length === 0) return
    const committed = value ?? null
    let next: string | null = null
    let nextSource: 'keyboard' | 'pointer' | null = null
    if (committed != null && enabled.some(opt => opt.value === committed)) {
      next = committed
    } else if (pendingDirectionRef.current != null) {
      const at =
        pendingDirectionRef.current === 1 ? enabled[0] : enabled[enabled.length - 1]
      if (at) next = at.value
    } else if (pendingTypingRef.current) {
      // Deferred typing rule: first enabled match, Tab-eligible.
      const first = enabled[0]
      if (first) {
        next = first.value
        nextSource = 'keyboard'
      }
    }
    needsResolveRef.current = false
    pendingDirectionRef.current = null
    pendingTypingRef.current = false
    activeSourceRef.current = nextSource
    setActiveSourceState(nextSource)
    setActiveValueState(next)
  }, [isOpen, optionsVersion, value, inputValue, getOrderedOptions, collectionConflict, requestVirtualIndex, searchVirtual])

  // Windowed mount resolution (CB-VIRT-01): the Listbox window populates
  // the registry on its own (frozen side), so each registration commit
  // rechecks the shared pending slot. A mounted target clears the slot —
  // the active value was already set at request time, so the ID now
  // derives and publishes. Stale mounts (value mismatch) never clear.
  React.useEffect(() => {
    if (!isOpen || !windowedRef.current) return
    const pending = pendingVirtualRef.current
    if (!pending) return
    const entry = optionsMapRef.current.get(pending.value)
    if (entry?.node?.isConnected) {
      pendingVirtualRef.current = null
      setPendingVirtualIndex(null)
    }
  }, [isOpen, optionsVersion])

  // Dynamic-data active follow (CB-NAV-06): as mounted options change
  // while open, identity stays when still valid; an invalidated active
  // value (unregistered, or registered-but-disabled) falls to the
  // positional neighbor — the item now at its last index, clamped to the
  // end — chosen from mounted options only. Two guards keep this from
  // overreaching: registered-but-disconnected entries are NAV-07 yanked
  // nodes, not data changes (the ID omits via derivation, no pick); and
  // an invalidated COMMITTED value clears to null instead of picking —
  // the app removed its own selection, so Combobox must not guess the
  // next one (CB-DOM-05, CB-NAV-07). Pending logical requests (VIRT/grid
  // scrolls in flight) always win over this fallback.
  React.useEffect(() => {
    if (!isOpen || collectionConflict) {
      lastOrderRef.current = []
      return
    }
    const order = getOrderedOptions()
      .filter(opt => !opt.disabled)
      .map(opt => opt.value)
    const prev = lastOrderRef.current
    lastOrderRef.current = order
    if (pendingVirtualRef.current) return
    if (activeValue == null || order.includes(activeValue)) return
    const live = optionsMapRef.current.get(activeValue)
    if (live && !live.disabled && !(live.node?.isConnected === true)) return
    if (activeValue === (value ?? null)) {
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
      return
    }
    const lastIndex = prev.indexOf(activeValue)
    const at = lastIndex === -1 ? 0 : Math.min(lastIndex, order.length - 1)
    const next = at >= 0 ? (order[at] ?? null) : null
    activeSourceRef.current = null
    setActiveSourceState(null)
    setActiveValueState(next)
  }, [isOpen, optionsVersion, activeValue, value, collectionConflict, getOrderedOptions])
}
