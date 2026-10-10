/**
 * Input part: a slot registrar, not a renderer. The authored props
 * (including the ref) register under the 'input' slot and the single
 * layout unfolds them into the managed input; the part itself renders
 * null.
 */
import * as React from 'react'
import { useSlotRegistration } from '../slots/slots'
import type { DateFieldInputProps } from '../types'

export const DateFieldInput = React.forwardRef<HTMLInputElement, DateFieldInputProps>(
  function DateFieldInput(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'input',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldInput.displayName = 'DateFieldInput'
