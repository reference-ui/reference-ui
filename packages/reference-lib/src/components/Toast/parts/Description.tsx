/**
 * Toast description part: the body line beneath the title. Merges the
 * item context's description class with the caller's own, mirroring the
 * title part's layering for host-level theming.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ToastItemContext } from '../context'
import type { ToastDescriptionProps } from '../types'

export function ToastDescription({
  children,
  className,
  ...props
}: ToastDescriptionProps) {
  const itemContext = React.useContext(ToastItemContext)
  return (
    <Div
      data-reference-toast-description=""
      className={[itemContext?.classNames?.description, className].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {children}
    </Div>
  )
}
