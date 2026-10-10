/**
 * Listbox's selection authority: membership tests and the selectOption
 * commit. Inside a Combobox, commits yield to the combobox owner; in
 * multiple mode the next array comes from the selection reducer with
 * known values in collection order. Single-mode re-activation of the
 * selected option is a no-op (LB-SINGLE-05).
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import { computeNextMultipleSelection } from '../selection/multiple'
import type {
  ListboxSelection,
  ListboxValue,
  ListboxVirtualAdapter,
  OptionRecord,
  VirtualFocusItem,
} from '../types'

export interface ListboxSelectionApi {
  isOptionSelected: (val: string) => boolean
  selectOption: (val: string) => void
}

export function useListboxSelection(
  selection: ListboxSelection,
  controlledValue: ListboxValue | null,
  combobox: ComboboxContextValue | null,
  onChange: ((value: any) => void) | undefined,
  virtual: ListboxVirtualAdapter | undefined,
  getOrderedOptions: () => OptionRecord[]
): ListboxSelectionApi {
  const isOptionSelected = React.useCallback(
    (val: string) => {
      if (selection === 'single') {
        return controlledValue === val
      }
      return Array.isArray(controlledValue) && controlledValue.includes(val)
    },
    [selection, controlledValue]
  )

  const selectOption = React.useCallback(
    (val: string) => {
      if (combobox) {
        combobox.handleSelect(val)
        return
      }

      if (selection === 'single') {
        // LB-SINGLE-05: Activating already-selected option is a no-op
        if (controlledValue === val) return
        onChange?.(val as any)
      } else {
        const orderedKnown = virtual
          ? virtual.items.map((i: VirtualFocusItem) => i.value)
          : getOrderedOptions().map(o => o.value)
        const nextValues = computeNextMultipleSelection(controlledValue, val, orderedKnown)
        onChange?.(nextValues as any)
      }
    },
    [selection, controlledValue, combobox, onChange, virtual, getOrderedOptions]
  )

  return { isOptionSelected, selectOption }
}
