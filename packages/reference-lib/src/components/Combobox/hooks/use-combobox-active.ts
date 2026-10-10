/**
 * Combobox's active state: the source-tagged setter parts and collections
 * share. Clearing always works; sets go inert under a two-authority
 * conflict, and a non-keyboard request for the committed value while
 * keyboard-active is ignored so Listbox root leave cannot clobber
 * keyboard intent (leave-restore, #9 joint seam). The ref mirrors state
 * for synchronous leave and blur decisions.
 */
import * as React from 'react'
import type { ComboboxSession } from './use-combobox-session'

export interface ComboboxActive {
  setActiveValue: (val: string | null, source?: 'keyboard' | 'pointer' | null) => void
  clearPointerActive: () => void
}

export function useComboboxActive(
  session: ComboboxSession,
  value: string | null,
  collectionConflict: boolean
): ComboboxActive {
  const { activeSourceRef, setActiveSourceState, setActiveValueState } = session

  const setActiveValue = React.useCallback(
    (val: string | null, source: 'keyboard' | 'pointer' | null = 'pointer') => {
      // Two-authority conflict (#5, CB-ADAPTER-08): active sets are
      // inert (clearing still works) until exactly one authority
      // remains. Covers Listbox hover/focus call sites too.
      if (collectionConflict && val !== null) return
      if (val === null) {
        activeSourceRef.current = null
        setActiveSourceState(null)
        setActiveValueState(null)
        return
      }
      // Leave-restore (#9 joint seam): a non-keyboard request for the
      // committed value while keyboard-active is ignored, so Listbox root
      // leave cannot clobber keyboard intent. Pointer to any other value
      // still overwrites (CB-NAV-05 hover half).
      if (
        source !== 'keyboard' &&
        activeSourceRef.current === 'keyboard' &&
        val === (value ?? null)
      ) {
        return
      }
      activeSourceRef.current = source
      setActiveSourceState(source)
      setActiveValueState(val)
    },
    [value, collectionConflict]
  )

  const clearPointerActive = React.useCallback(() => {
    if (activeSourceRef.current !== 'pointer') return
    activeSourceRef.current = null
    setActiveSourceState(null)
    setActiveValueState(value ?? null)
  }, [value])

  return { setActiveValue, clearPointerActive }
}
