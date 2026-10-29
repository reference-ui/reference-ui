/**
 * ReferenceLibrary public vocabulary: mount props and the toaster config
 * shape (position, duration, limit, hotkey, theme, icons) resolved onto
 * the Toast host. Imported by the component, parts, and warmup.
 */
import type * as React from 'react'
import type { ToastClassNames, ToastOffset, ToastTheme } from '../Toast'

export interface ReferenceLibraryToaster {
  /**
   * Where toasts appear.
   * @default 'bottom-end'
   */
  defaultPosition?: string
  /**
   * Auto-dismiss time in milliseconds.
   * @default 5000
   */
  defaultDuration?: number | false
  /**
   * Most toasts visible at once.
   * @default 4
   */
  limit?: number
  /**
   * Key combination that moves focus into the toasts; `false` turns it off.
   * @default ['altKey', 'KeyT']
   */
  hotkey?: string[] | false
  expand?: boolean
  gap?: number
  offset?: number | string | {
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
  }
  /** Show a close button on every toast. */
  closeButton?: boolean
  /** Use coloured backgrounds for typed toasts. */
  richColors?: boolean
  invert?: boolean
  dir?: 'rtl' | 'ltr' | 'auto'
  /**
   * Toast chrome theme. Toast colours follow this, not color mode.
   * @default 'light'
   */
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

export interface ReferenceLibraryTooltip {
  /**
   * Window in milliseconds during which neighbouring tooltips open without delay.
   * @default 300
   */
  skipDelay?: number
}

export interface ReferenceLibraryProps {
  /** Your app. */
  children?: React.ReactNode
  /** Defaults for every toast. The options are listed below. */
  toaster?: ReferenceLibraryToaster
  /** Tooltip group settings. */
  tooltip?: ReferenceLibraryTooltip
}
