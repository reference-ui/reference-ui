/**
 * Toast close part: the dismiss button, defaulting to an inline X glyph
 * when the caller passes no children and no close icon override. Follows
 * the same click-then-dismiss contract as action and cancel; the corner
 * variant styles it as a trailing circle inside default toasts.
 */
import * as React from 'react'
import { ToastItemContext } from '../context'
import { useToastActionClick } from '../hooks/use-action-dismiss'
import type { ToastCloseProps } from '../types'

export function ToastClose({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastCloseProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = useToastActionClick(onClick)

  return (
    <button
      type="button"
      data-reference-toast-close=""
      aria-label="Close"
      className={[itemContext?.classNames?.closeButton, className].filter(Boolean).join(' ') || undefined}
      style={style}
      {...props}
      onClick={handleClick}
    >
      {children ?? itemContext?.icons?.close ?? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  )
}
