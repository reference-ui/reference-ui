/**
 * Toast root part: the card shell every toast renders inside, custom or
 * default. Carries the unstyled opt-out that strips chrome styling while
 * keeping structure, and forwards className, style, and primitive props
 * to the underlying div.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { ToastRootProps } from '../types'

export function ToastRoot({
  children,
  style,
  className,
  unstyled,
  ...props
}: ToastRootProps) {
  return (
    <Div
      data-reference-toast-root=""
      data-unstyled={unstyled ? 'true' : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}
