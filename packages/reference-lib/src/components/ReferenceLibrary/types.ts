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
  /**
   * Keeps the stack open at full size. Otherwise it opens while the pointer is over it.
   * @default false
   */
  expand?: boolean
  /**
   * Space between toasts in an open stack, in pixels.
   * @default 14
   */
  gap?: number
  /**
   * Distance from the screen edge, in pixels. A string is a CSS length. An object sets each edge. Edges left out use `24`.
   * @default 24
   */
  offset?: number | string | {
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
  }
  /**
   * Show a close button on every toast.
   * @default false
   */
  closeButton?: boolean
  /**
   * Use coloured backgrounds for typed toasts.
   * @default false
   */
  richColors?: boolean
  /**
   * Swap the card colours: dark cards in the light theme, light cards in the dark theme.
   * @default false
   */
  invert?: boolean
  /**
   * Text direction of the toasts. It sets which edge a swipe dismisses toward. `auto` reads the document's `dir`.
   * @default 'auto'
   */
  dir?: 'rtl' | 'ltr' | 'auto'
  /**
   * Toast chrome theme. Toast colours follow this, not color mode.
   * @default 'light'
   */
  theme?: ToastTheme
  /**
   * Distance from the screen edge on screens narrower than 600px. Takes the same values as `offset`.
   * @default 16
   */
  mobileOffset?: ToastOffset
  /**
   * Accessible name of the region that holds the toasts.
   * @default 'Notifications'
   */
  containerAriaLabel?: string
  /** Replaces the built-in icons. Set `success`, `info`, `warning`, `error` or `loading` for a status icon, and `close` for the close button. */
  icons?: {
    /** Icon of success toasts. */
    success?: React.ReactNode
    /** Icon of info toasts. */
    info?: React.ReactNode
    /** Icon of warning toasts. */
    warning?: React.ReactNode
    /** Icon of error toasts. */
    error?: React.ReactNode
    /** Icon of loading toasts, shown in place of the spinner. */
    loading?: React.ReactNode
    /** Content of the close button. */
    close?: React.ReactNode
  }
  /**
   * Directions a swipe dismisses a toast. A toast's own `swipeDirections` wins.
   * @default toward the nearest screen edge of the toast's position
   */
  swipeDirections?: Array<'top' | 'right' | 'bottom' | 'left'>
  /** Defaults for every toast card. A toast's own options win. `classNames` merge, and `style` merges key by key. */
  toastOptions?: {
    /** Class hooks for the card's parts. */
    classNames?: ToastClassNames
    /**
     * Drops the card's own styling.
     * @default false
     */
    unstyled?: boolean
    /** Class hook for the card. */
    className?: string
    /** Inline style hook for the card. */
    style?: React.CSSProperties
    /** Show a close button on every toast. The `closeButton` above wins when it is set. */
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
