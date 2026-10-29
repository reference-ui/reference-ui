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
  /**
   * Reuse an id to replace a toast in place.
   * @default generated
   */
  id?: string
  /**
   * Milliseconds before it dismisses. `false` keeps it open.
   * @default 5000
   */
  duration?: number | false
  /**
   * Where it appears.
   * @default 'bottom-end'
   */
  position?: ToastPosition
  document?: Document
  /**
   * `false` stops swipe and button dismissal.
   * @default true
   */
  dismissible?: boolean
  /** Called when its duration runs out. */
  onAutoClose?: (id: string) => void
  /** Called when the toast is dismissed. */
  onDismiss?: (id: string) => void
  testId?: string
  invert?: boolean
  /**
   * Coloured backgrounds for typed toasts.
   * @default false
   */
  richColors?: boolean
  swipeDirections?: Array<'top' | 'right' | 'bottom' | 'left'>
  /**
   * Drops the card's own styling.
   * @default false
   */
  unstyled?: boolean
  /** Class hook for the card. */
  className?: string
  /** Inline style hook for the card. */
  style?: React.CSSProperties
  /** Class hooks for the card's parts. */
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
  /** Text for screen readers. */
  announce?: string
}

export interface DefaultToastOptions extends ToastOptions {
  /** Secondary text under the message. */
  description?: React.ReactNode
  /**
   * Shows a close button.
   * @default false
   */
  closeButton?: boolean
  /**
   * Status icon. The typed calls set it.
   * @default 'default'
   */
  type?: ToastType
  /** Button on the default card. */
  action?: ToastAction
  /** Button on the default card. */
  cancel?: ToastAction
  /** Replaces the status icon. */
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

/** The `toast` function and its methods. */
export interface ToastApi {
  /**
   * Shows a default toast. `toast.message` and `toast.show` are the same call.
   * @param message The toast's title. A React element shows as the whole toast.
   * @param options Options for this toast.
   * @returns The toast's id.
   */
  (message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows a default toast. Same as calling `toast` directly. */
  show(content: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows a default toast. Same as calling `toast` directly. */
  message(message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows a success toast. */
  success(message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows an error toast. */
  error(message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows a warning toast. */
  warning(message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows an info toast. */
  info(message: React.ReactNode, options?: DefaultToastOptions): string
  /** Shows a loading toast with no duration. */
  loading(message: React.ReactNode, options?: DefaultToastOptions): string
  /**
   * Shows `data.loading`, then `data.success` or `data.error`. `data.finally` runs once after.
   * @param promise The promise, or a function that returns it.
   * @param data What to show for each outcome.
   * @param options Options for the toast.
   * @returns The promise, with an `unwrap` method that returns its result.
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    data: PromiseData<T>,
    options?: ToastOptions
  ): Promise<T> & { unwrap: () => Promise<T> }
  /**
   * Shows `render(id)` as the toast.
   * @param render Returns the toast's content from its id.
   * @param options Options for the toast.
   * @returns The toast's id.
   */
  custom(render: (id: string) => React.ReactNode, options?: ToastOptions): string
  /**
   * Returns a callable toast with `update(id, props)` and `dismiss(id)`.
   * @param config The `render` function, and an optional default `duration` and `position`.
   * @returns The toast definition.
   */
  define<P = void>(config: {
    duration?: number | false
    position?: ToastPosition
    render: (props: P, controls: ToastControls) => React.ReactNode
  }): ToastDefinition<P>
  /**
   * Replaces a visible toast's content and options.
   * @param id The toast's id.
   * @param content The new message, or a React element.
   * @param options The new options.
   */
  update(id: string, content: React.ReactNode, options?: DefaultToastOptions): void
  /**
   * Dismisses one toast, or all of them when `id` is omitted.
   * @param id The toast's id.
   * @param options Pass `document` to target another document.
   */
  dismiss(id?: string, options?: { document?: Document }): void
  /**
   * Dismisses every toast.
   * @param options Pass `document` to target another document.
   */
  dismissAll(options?: { document?: Document }): void
  /**
   * The toasts in the queue.
   * @param doc The document to read.
   */
  getToasts(doc?: Document): ToastHistoryRecord[]
  /**
   * Records of the toasts shown, dismissed ones included.
   * @param doc The document to read.
   */
  getHistory(doc?: Document): ToastHistoryRecord[]
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
  /** Drops the card's own styling. */
  unstyled?: boolean
}

export type ToastTitleProps = PrimitiveProps<'div'>

export type ToastDescriptionProps = PrimitiveProps<'div'>

export type ToastActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export type ToastCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>
