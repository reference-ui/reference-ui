/**
 * Toast cancel part: the secondary pill button beside the action. Shares
 * the action's click-then-dismiss contract and context-driven styling,
 * differing only in its data hook and cancel-button style slots.
 */
import * as React from 'react'
import { ToastItemContext } from '../context'
import { useToastActionClick } from '../hooks/use-action-dismiss'

export type ToastCancelProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function ToastCancel({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastCancelProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = useToastActionClick(onClick)

  return (
    <button
      type="button"
      data-reference-toast-cancel=""
      className={[itemContext?.classNames?.cancelButton, className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.cancelButtonStyle, ...style }}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
