/**
 * Toast action part: the primary pill button inside a toast card. Runs
 * the caller's click first, then dismisses its own toast unless the
 * event was prevented or the toast is not dismissible. Reads its id,
 * styling, and dismissibility from the item context.
 */
import * as React from 'react'
import { ToastItemContext } from '../context'
import { useToastActionClick } from '../hooks/use-action-dismiss'
import type { ToastActionProps } from '../types'

export function ToastAction({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastActionProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = useToastActionClick(onClick)

  return (
    <button
      type="button"
      data-reference-toast-action=""
      className={[itemContext?.classNames?.actionButton, className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.actionButtonStyle, ...style }}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
