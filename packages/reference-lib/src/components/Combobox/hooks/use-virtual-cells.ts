/**
 * Combobox's grid cells (#5): VirtualItem mount registration with
 * metadata-identity validation and duplicate-index rejection, pointer
 * preview on mounted cells, and click/tap commit. Mounts mirror into
 * the option registry so active IDs and labels resolve, and clear a
 * matching pending request. Stale mounts from replaced adapters are
 * ignored (CB-ADAPTER-07), never published.
 */
import * as React from 'react'
import type { ComboboxVirtualEntry } from '../combobox-context'
import { comboboxDiagnostic } from '../shared/diagnostic'
import { validateVirtualMount } from '../virtual-focus'
import type { ComboboxSession } from './use-combobox-session'

export interface VirtualCells {
  registerVirtualItem: (entry: ComboboxVirtualEntry) => () => void
  previewVirtualItem: (index: number) => void
  commitVirtualItem: (index: number) => void
}

export function useVirtualCells(
  session: ComboboxSession,
  setActiveValue: (val: string | null, source?: 'keyboard' | 'pointer' | null) => void,
  handleSelect: (nextVal: string | null) => void
): VirtualCells {
  const {
    adapterRef,
    virtualMapRef,
    optionsMapRef,
    labelCacheRef,
    setOptionsVersion,
    pendingVirtualRef,
    setPendingVirtualIndex,
  } = session

  // VirtualItem mount registration (#5): validates range + value
  // identity against current metadata (stale mounts from replaced
  // adapters are ignored, CB-ADAPTER-07), rejects duplicate mounted
  // indices (CB-ADAPTER-05), mirrors into the mounted registry so the
  // active ID, commit labels, and revert labels resolve, and clears a
  // matching pending request (CB-ADAPTER-01 mount timing).
  const registerVirtualItem = React.useCallback(
    (entry: ComboboxVirtualEntry) => {
      const adapter = adapterRef.current
      const expected = adapter?.items[entry.index]
      if (
        !adapter ||
        !validateVirtualMount(adapter.items, entry.index) ||
        expected?.value !== entry.value
      ) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${entry.index} does not match current adapter metadata (stale mount or out of range). Ignored; it cannot become active.`
        )
        return () => {}
      }
      // A live entry already present means two cells mounted the same
      // index: unmount cleanup always removes first, so remounts and
      // re-registrations never trip this.
      if (virtualMapRef.current.has(entry.index)) {
        comboboxDiagnostic(
          `Duplicate Combobox.VirtualItem mount at index ${entry.index}. Only one cell may mount per logical index.`
        )
        return () => {}
      }
      virtualMapRef.current.set(entry.index, entry)
      const labelText = expected.textValue || entry.value
      optionsMapRef.current.set(entry.value, {
        value: entry.value,
        id: entry.id,
        node: entry.node,
        disabled: entry.disabled,
        textValue: labelText,
        index: entry.index,
      })
      labelCacheRef.current.set(entry.value, labelText)
      setOptionsVersion(v => v + 1)
      const pending = pendingVirtualRef.current
      if (pending && pending.index === entry.index && pending.value === entry.value) {
        pendingVirtualRef.current = null
        setPendingVirtualIndex(null)
        setActiveValue(entry.value, 'keyboard')
      }
      return () => {
        virtualMapRef.current.delete(entry.index)
        const current = optionsMapRef.current.get(entry.value)
        if (current?.id === entry.id) optionsMapRef.current.delete(entry.value)
        setOptionsVersion(v => v + 1)
      }
    },
    [setActiveValue]
  )

  // Pointer preview on a mounted cell (#5, CB-ADAPTER-06 movement half).
  const previewVirtualItem = React.useCallback(
    (index: number) => {
      const adapter = adapterRef.current
      if (!adapter) return
      if (!validateVirtualMount(adapter.items, index)) {
        comboboxDiagnostic(
          `Combobox grid preview index ${index} is out of range. Ignored.`
        )
        return
      }
      const entry = virtualMapRef.current.get(index)
      if (!entry || !entry.node || !entry.node.isConnected || entry.disabled) return
      setActiveValue(entry.value, 'pointer')
    },
    [setActiveValue]
  )

  // Click/tap commit on a mounted cell (#5, CB-ADAPTER-06 commit half).
  const commitVirtualItem = React.useCallback(
    (index: number) => {
      const adapter = adapterRef.current
      if (!adapter) return
      const entry = virtualMapRef.current.get(index)
      if (!entry || !entry.node || !entry.node.isConnected || entry.disabled) return
      handleSelect(entry.value)
    },
    [handleSelect]
  )

  return { registerVirtualItem, previewVirtualItem, commitVirtualItem }
}
