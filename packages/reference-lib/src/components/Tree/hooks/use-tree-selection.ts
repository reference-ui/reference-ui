/**
 * Tree's selection authority: membership display and the selectItem
 * commit. Inside a Combobox the root owns commits and selectItem routes
 * there; standalone selection is fully controlled and idempotent —
 * re-selecting the selected value is a no-op, never a toggle
 * (TR-SELECT-03).
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'

export interface TreeSelection {
  isItemSelected: (id: string) => boolean
  selectItem: (id: string) => void
}

export function useTreeSelection(
  effectiveValue: string | null | undefined,
  value: string | null | undefined,
  combobox: ComboboxContextValue | null,
  onChange: ((value: string | null) => void) | undefined
): TreeSelection {
  const isItemSelected = React.useCallback(
    (id: string) => effectiveValue === id,
    [effectiveValue]
  )

  const selectItem = React.useCallback(
    (id: string) => {
      // TR-CB-04: inside Combobox the root owns commits — route there and
      // never invoke a nested onChange (diagnosed at render, ignored here).
      if (combobox) {
        combobox.handleSelect(id)
        return
      }
      if (onChange === undefined) {
        return
      }
      // Single selection is idempotent, not a toggle (TR-SELECT-03)
      if (value === id) {
        return
      }
      onChange(id)
    },
    [combobox, onChange, value]
  )

  return { isItemSelected, selectItem }
}
