/**
 * End part: a slot registrar for the range's end input. The authored
 * props register under the 'end' slot and the endpoint input unfolds
 * them into the managed field; the part itself renders null.
 */
import * as React from 'react'
import { useSlotRegistration } from '../slots/slots'
import type { DateFieldEndProps } from '../types'

export const DateFieldEnd: React.ForwardRefExoticComponent<
  DateFieldEndProps & React.RefAttributes<HTMLInputElement>
> = React.forwardRef<HTMLInputElement, DateFieldEndProps>(
  function DateFieldEnd(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'end',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldEnd.displayName = 'DateFieldEnd'
