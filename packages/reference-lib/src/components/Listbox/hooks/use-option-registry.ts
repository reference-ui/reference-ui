/**
 * Listbox's option registry: render-time duplicate identity detection,
 * commit-phase registration with virtual-adapter validation, DOM-order
 * enumeration, and re-validation when the logical items are replaced.
 * Registration throws on duplicate values in both phases (LB-DOM-06):
 * render-time by id comparison so StrictMode double-renders stay
 * deterministic, commit-time by registry membership.
 */
import * as React from 'react'
import type { ListboxSession } from './use-listbox-session'
import type { ListboxVirtualAdapter, OptionRecord } from '../types'
import { toMountedIndexEntries, validateVirtualAdapter } from '../virtual/adapter'

export interface OptionRegistry {
  registerOption: (record: OptionRecord) => () => void
  registerRenderValue: (val: string, id: string) => void
  getOrderedOptions: () => OptionRecord[]
  optionsCount: number
}

export function useOptionRegistry(
  session: ListboxSession,
  virtual: ListboxVirtualAdapter | undefined
): OptionRegistry {
  const { optionsMapRef, renderValuesMapRef, virtualRef, setOptionsVersion, setPendingVirtualIndex } = session

  // Render-time duplicate detection (id comparison: deterministic across
  // StrictMode and React 17/18 indeterminate double-renders; colliding
  // derived ids fall through to the commit-phase registerOption check below)
  renderValuesMapRef.current.clear()

  const registerRenderValue = React.useCallback(
    (val: string, id: string) => {
      const existingId = renderValuesMapRef.current.get(val)
      if (existingId && existingId !== id) {
        throw new Error(
          `Reference UI: Duplicate option value "${val}". Option values must be unique.`
        )
      }
      renderValuesMapRef.current.set(val, id)
    },
    []
  )

  // Live virtual adapter for registration-time validation (ref: registering
  // options must not re-subscribe when the adapter object identity changes).
  virtualRef.current = virtual

  const registerOption = React.useCallback(
    (record: OptionRecord) => {
      const existing = optionsMapRef.current.get(record.value)
      if (existing) {
        throw new Error(
          `Reference UI: Duplicate option value "${record.value}". Option values must be unique.`
        )
      }

      // LB-VIRT-09: validate an indexed mount against the live virtual adapter
      const liveVirtual = virtualRef.current
      if (liveVirtual && record.index != null) {
        const candidate = toMountedIndexEntries(optionsMapRef.current.values())
        candidate.push({ value: record.value, index: record.index, disabled: record.disabled })
        validateVirtualAdapter(liveVirtual, candidate)
      }

      optionsMapRef.current.set(record.value, record)
      setOptionsVersion(v => v + 1)

      return () => {
        optionsMapRef.current.delete(record.value)
        setOptionsVersion(v => v + 1)
      }
    },
    []
  )

  const virtualItems = virtual?.items

  // LB-VIRT-09: re-validate mounted indexed options when logical items change.
  // An atomic adapter replacement also drops any pending target: the index
  // may name a different logical item under the new order, so the next
  // command must start from mounted intent, never a stale closure.
  React.useEffect(() => {
    const liveVirtual = virtualRef.current
    if (!liveVirtual || !virtualItems) return
    setPendingVirtualIndex(null)
    validateVirtualAdapter(liveVirtual, toMountedIndexEntries(optionsMapRef.current.values()))
  }, [virtualItems])

  const getOrderedOptions = React.useCallback((): OptionRecord[] => {
    const records = Array.from(optionsMapRef.current.values())
    return records
      .filter(rec => rec.ref.current && rec.ref.current.isConnected)
      .sort((a, b) => {
        const elA = a.ref.current!
        const elB = b.ref.current!
        const pos = elA.compareDocumentPosition(elB)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
  }, [])

  return { registerOption, registerRenderValue, getOrderedOptions, optionsCount: optionsMapRef.current.size }
}
