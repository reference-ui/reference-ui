/**
 * Trigger part: a slot registrar for the picker toggle. The authored
 * props register under the 'trigger' slot and the layout unfolds them
 * (or synthesizes the default calendar button when only a picker is
 * present); the part itself renders null. Shared by both hosts.
 */
import * as React from 'react'
import { useSlotRegistration } from '../slots/slots'
import type { DateFieldTriggerProps } from '../types'

export const DateFieldTrigger = React.forwardRef<HTMLButtonElement, DateFieldTriggerProps>(
  function DateFieldTrigger(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'trigger',
      element: <button {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldTrigger.displayName = 'DateFieldTrigger'
