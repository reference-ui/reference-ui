import type * as React from 'react'
import type { ToastClassNames, ToastOffset, ToastTheme } from '../Toast'

export interface ReferenceLibraryToaster {
  defaultPosition?: string
  defaultDuration?: number | false
  limit?: number
  hotkey?: string[] | false
  expand?: boolean
  gap?: number
  offset?: number | string | {
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
  }
  closeButton?: boolean
  richColors?: boolean
  invert?: boolean
  dir?: 'rtl' | 'ltr' | 'auto'
  theme?: ToastTheme
  mobileOffset?: ToastOffset
  containerAriaLabel?: string
  icons?: {
    success?: React.ReactNode
    info?: React.ReactNode
    warning?: React.ReactNode
    error?: React.ReactNode
    loading?: React.ReactNode
    close?: React.ReactNode
  }
  swipeDirections?: Array<'top' | 'right' | 'bottom' | 'left'>
  toastOptions?: {
    classNames?: ToastClassNames
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    closeButton?: boolean
  }
}

export interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: ReferenceLibraryToaster
  tooltip?: {
    skipDelay?: number
  }
}
