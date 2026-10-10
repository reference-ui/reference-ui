/**
 * Combobox's mounted registry: option registration with label-cache
 * capture, and DOM-order enumeration over still-connected nodes.
 * Registration mutates the map and bumps the session version so the
 * mounted-only active ID recomputes; the map stays the source of truth.
 */
import * as React from 'react'
import type { ComboboxOptionEntry } from '../combobox-context'
import type { ComboboxSession } from './use-combobox-session'

export interface ComboboxRegistry {
  registerOption: (entry: ComboboxOptionEntry) => () => void
  getOrderedOptions: () => ComboboxOptionEntry[]
}

export function useComboboxRegistry(session: ComboboxSession): ComboboxRegistry {
  const { optionsMapRef, labelCacheRef, setOptionsVersion } = session

  const registerOption = React.useCallback((entry: ComboboxOptionEntry) => {
    optionsMapRef.current.set(entry.value, entry)
    if (entry.textValue) labelCacheRef.current.set(entry.value, entry.textValue)
    setOptionsVersion(v => v + 1)
    return () => {
      optionsMapRef.current.delete(entry.value)
      setOptionsVersion(v => v + 1)
    }
  }, [])

  const getOrderedOptions = React.useCallback((): ComboboxOptionEntry[] => {
    const entries = Array.from(optionsMapRef.current.values())
    return entries
      .filter(entry => entry.node && entry.node.isConnected)
      .sort((a, b) => {
        const pos = a.node!.compareDocumentPosition(b.node!)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
  }, [])

  return { registerOption, getOrderedOptions }
}
