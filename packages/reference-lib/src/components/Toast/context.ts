/**
 * Toast's private subtree scope: the per-item context the stack provider
 * fills (identity, chrome overrides, styling) and every chrome part reads.
 * Compound parts (Title, Action, Close) consume this instead of props, so
 * custom toast trees stay terse. Also re-exported from the index for
 * structural consumers that bridge custom renderers.
 */
import * as React from 'react'
import type { ToastClassNames, ToastIcons } from './types'

export interface ToastItemContextValue {
  id?: string
  dismissible?: boolean
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
  type?: string
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

export const ToastItemContext = React.createContext<ToastItemContextValue>({})
