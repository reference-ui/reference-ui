/**
 * Toast chrome click hook: the shared click-then-dismiss contract behind
 * the action, cancel, and close parts. Runs the caller's handler first,
 * then dismisses the context's toast unless the event was prevented or
 * the toast opted out of dismissibility.
 */
import * as React from 'react'
import { ToastItemContext } from '../context'
import { referenceToast } from '../state/reference'

export function useToastActionClick(onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void) {
  const itemContext = React.useContext(ToastItemContext)
  return (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !itemContext?.id) return
    if (itemContext.dismissible === false) return
    referenceToast.dismiss(itemContext.id)
  }
}
