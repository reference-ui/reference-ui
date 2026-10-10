/**
 * Picker part: a slot registrar for the overlay popover. The authored
 * props register under the 'picker' slot and the picker layer unfolds
 * them into the managed Overlay.Content; the part itself renders null.
 * Its presence alone switches the input to combobox semantics. Shared
 * by both hosts.
 */
import * as React from 'react'
import { useSlotRegistration } from '../slots/slots'
import type { DateFieldPickerProps } from '../types'

export const DateFieldPicker = React.forwardRef<HTMLDivElement, DateFieldPickerProps>(
  function DateFieldPicker(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'picker',
      element: <div {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldPicker.displayName = 'DateFieldPicker'
