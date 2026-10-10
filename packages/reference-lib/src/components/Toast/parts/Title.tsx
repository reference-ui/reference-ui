/**
 * Toast title part: the headline line of a toast card. Merges the item
 * context's title class with the caller's own so host-level theming and
 * per-toast overrides compose without prop drilling.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ToastItemContext } from '../context'
import type { ToastTitleProps } from '../types'

export function ToastTitle({
  children,
  className,
  ...props
}: ToastTitleProps) {
  const itemContext = React.useContext(ToastItemContext)
  return (
    <Div
      data-reference-toast-title=""
      className={[itemContext?.classNames?.title, className].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {children}
    </Div>
  )
}
