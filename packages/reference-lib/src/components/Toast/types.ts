/**
 * Toast's public contract: every prop, option, and record type the index
 * re-exports, gathered from the chrome, API, host, and runtime so no
 * consumer imports a deep module for a shape. Kept free of JSX and logic —
 * the API, parts, stack, and ReferenceLibrary's own props all read these
 * without mounting anything.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastActionOption {
  label: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export type ToastAction = ToastActionOption | React.ReactNode

export interface ToastIcons {
  success?: React.ReactNode
  info?: React.ReactNode
  warning?: React.ReactNode
  error?: React.ReactNode
  loading?: React.ReactNode
  close?: React.ReactNode
}

export interface ToastClassNames {
  toast?: string
  title?: string
  description?: string
  icon?: string
  loader?: string
  closeButton?: string
  actionButton?: string
  cancelButton?: string
}

export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

export interface ToastOptions {
  id?: string
  duration?: number | false
  position?: ToastPosition
  document?: Document
  dismissible?: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: Array<'top' | 'right' | 'bottom' | 'left'>
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
  announce?: string
}

export interface DefaultToastOptions extends ToastOptions {
  description?: React.ReactNode
  closeButton?: boolean
  type?: ToastType
  action?: ToastAction
  cancel?: ToastAction
  icon?: React.ReactNode
}

export interface PromiseExtendedResult extends Omit<DefaultToastOptions, 'id'> {
  message: React.ReactNode
}

export type PromiseResult<T> =
  | React.ReactNode
  | ((data: T) => React.ReactNode | Promise<React.ReactNode> | PromiseExtendedResult | Promise<PromiseExtendedResult>)
  | PromiseExtendedResult

export interface PromiseData<ToastData = any> {
  loading?: React.ReactNode
  success?: PromiseResult<ToastData>
  error?: PromiseResult<any>
  description?: React.ReactNode | ((data: ToastData) => React.ReactNode)
  finally?: () => void | Promise<void>
}

export interface ToastControls {
  id: string
  close(): void
}

export interface ToastDefinition<P = void> {
  (props: P, options?: ToastOptions): string
  update: (id: string, props: P, options?: ToastOptions) => void
  dismiss: (id: string) => void
}

export type ToastOffset =
  | number
  | string
  | {
      top?: string | number
      right?: string | number
      bottom?: string | number
      left?: string | number
    }

export type ToastTheme = 'light' | 'dark' | 'system'

export interface ToastHostProps {
  limit?: number
  defaultDuration?: number | false
  defaultPosition?: string
  hotkey?: readonly string[] | false
  expand?: boolean
  gap?: number
  offset?: ToastOffset
  mobileOffset?: ToastOffset
  closeButton?: boolean
  richColors?: boolean
  invert?: boolean
  theme?: ToastTheme
  dir?: 'rtl' | 'ltr' | 'auto'
  containerAriaLabel?: string
  icons?: ToastIcons
  swipeDirections?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>
  toastOptions?: {
    classNames?: ToastClassNames
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    closeButton?: boolean
    duration?: number | false
  }
}

export type ToastDismissReason = 'auto' | 'manual'

export interface ToastHistoryRecord {
  id: string
  type?: string
  position?: string
  createdAt: number
  updatedAt: number
  dismissedAt?: number
}

export interface ToastItem {
  id: string
  generation: number
  content?: React.ReactNode | ((id: string) => React.ReactNode)
  title?: React.ReactNode
  description?: React.ReactNode
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number | false
  dismissible: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
  exiting?: boolean
  closeButton?: boolean
  action?: ToastAction
  cancel?: ToastAction
  icon?: React.ReactNode
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

export interface ReferenceToastOptions {
  id?: string
  duration?: number | false
  position?: string
  document?: Document
  dismissible?: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
  title?: React.ReactNode
  description?: React.ReactNode
  closeButton?: boolean
  action?: ToastAction
  cancel?: ToastAction
  icon?: React.ReactNode
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

export type ToastRootProps = PrimitiveProps<'div'> & {
  unstyled?: boolean
}

export type ToastTitleProps = PrimitiveProps<'div'>

export type ToastDescriptionProps = PrimitiveProps<'div'>

export type ToastActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export type ToastCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>
