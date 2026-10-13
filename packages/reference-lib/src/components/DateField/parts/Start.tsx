/**
 * Start part: a slot registrar for the range's start input. The authored
 * props register under the 'start' slot and the endpoint input unfolds
 * them into the managed field; the part itself renders null.
 */
import * as React from 'react'
import { useSlotRegistration } from '../slots/slots'
import type { DateFieldStartProps } from '../types'

export const DateFieldStart: React.ForwardRefExoticComponent<
  DateFieldStartProps & React.RefAttributes<HTMLInputElement>
> = React.forwardRef<HTMLInputElement, DateFieldStartProps>(
  function DateFieldStart(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'start',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldStart.displayName = 'DateFieldStart'
