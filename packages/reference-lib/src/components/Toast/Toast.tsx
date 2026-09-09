import * as React from 'react'
import { announce } from '../Announcer'
import { splitPromiseResult } from './toastQueue'
import {
  generateToastId,
  getToastStore,
  peekToastGeneration,
  referenceToast,
  resolveToastDocument,
  toastDiagnostic,
} from './toastRuntime'
import type { ToastAction, ToastClassNames, ToastType } from './toastContext'
import {
  DefaultToast,
  Toast,
  ToastAction as ToastActionButton,
  ToastCancel,
  ToastClose,
  ToastDescription,
  ToastLoader,
  ToastRoot,
  ToastTitle,
} from './ToastChrome'

export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

export type {
  ToastAction,
  ToastActionOption,
  ToastClassNames,
  ToastIcons,
  ToastType,
} from './toastContext'
export {
  DefaultToast,
  Toast,
  ToastAction as ToastActionButton,
  ToastCancel,
  ToastClose,
  ToastDescription,
  ToastLoader,
  ToastRoot,
  ToastTitle,
}

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

export type { ToastRootProps, ToastTitleProps, ToastDescriptionProps, ToastActionProps, ToastCloseProps } from './ToastChrome'

function maybeAnnounce(options?: ToastOptions) {
  if (options?.announce == null) return
  announce(options.announce, { document: options.document })
}

function showToast(content: React.ReactNode, options?: DefaultToastOptions): string {
  const id = React.isValidElement(content)
    ? referenceToast.show(content, options)
    : referenceToast.show(undefined, { ...options, title: content })
  maybeAnnounce(options)
  return id
}

function updateToast(id: string, content: React.ReactNode, options?: DefaultToastOptions): void {
  if (React.isValidElement(content)) {
    referenceToast.update(id, content, options)
  } else {
    referenceToast.update(id, undefined, { ...options, title: content })
  }
  maybeAnnounce(options)
}

async function applyPromiseUpdate(
  id: string,
  raw: unknown,
  fallback: React.ReactNode,
  type: 'success' | 'error',
  options: ToastOptions | undefined,
  description?: React.ReactNode
) {
  const value = raw instanceof Promise ? await raw : raw
  const extended = splitPromiseResult(value)
  if (extended) {
    const extra = extended.options as DefaultToastOptions
    updateToast(id, (extended.message as React.ReactNode) ?? fallback, {
      ...options,
      ...extra,
      type: extra.type ?? type,
      description: extra.description ?? description,
      duration: extra.duration ?? options?.duration ?? 4000,
    })
    return
  }
  updateToast(id, (value as React.ReactNode) ?? fallback, {
    ...options,
    type,
    description,
    duration: options?.duration ?? 4000,
  })
}

const toastCallable = (message: React.ReactNode, options?: DefaultToastOptions): string => {
  return showToast(message, options)
}

export const toast = Object.assign(toastCallable, {
  show(content: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(content, options)
  },

  update(id: string, content: React.ReactNode, options?: DefaultToastOptions): void {
    updateToast(id, content, options)
  },

  dismiss(id?: string, options?: { document?: Document }): void {
    if (id == null) {
      referenceToast.dismissAll(options)
      return
    }
    referenceToast.dismiss(id, options)
  },

  dismissAll(options?: { document?: Document }): void {
    referenceToast.dismissAll(options)
  },

  getToasts(doc?: Document) {
    return referenceToast.getToasts(doc)
  },

  getHistory(doc?: Document) {
    return referenceToast.getHistory(doc)
  },

  message(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, options)
  },

  custom(render: (id: string) => React.ReactNode, options?: ToastOptions): string {
    const id = options?.id ?? generateToastId()
    const shown = referenceToast.show(render, { ...options, id })
    maybeAnnounce(options)
    return shown
  },

  success(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, { ...options, type: 'success' })
  },

  error(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, { ...options, type: 'error' })
  },

  warning(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, { ...options, type: 'warning' })
  },

  info(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, { ...options, type: 'info' })
  },

  loading(message: React.ReactNode, options?: DefaultToastOptions): string {
    return showToast(message, { ...options, type: 'loading', duration: false })
  },

  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    data: PromiseData<T>,
    options?: ToastOptions
  ): Promise<T> & { unwrap: () => Promise<T> } {
    const id = showToast(data.loading ?? 'Loading...', {
      ...options,
      type: 'loading',
      duration: false,
    })

    const original = typeof promise === 'function' ? promise() : promise

    const settled = original
      .then(async res => {
        const successRaw =
          typeof data.success === 'function' ? await data.success(res) : data.success
        const desc =
          typeof data.description === 'function' ? data.description(res) : data.description
        await applyPromiseUpdate(
          id,
          successRaw,
          'Completed successfully',
          'success',
          options,
          desc
        )
        return res
      })
      .catch(async err => {
        const errorRaw = typeof data.error === 'function' ? await data.error(err) : data.error
        await applyPromiseUpdate(id, errorRaw, 'An error occurred', 'error', options)
        throw err
      })
      .finally(async () => {
        await data.finally?.()
      }) as Promise<T> & { unwrap: () => Promise<T> }

    settled.unwrap = () => original
    return settled
  },

  define<P = void>(config: {
    duration?: number | false
    position?: ToastPosition
    render: (props: P, controls: ToastControls) => React.ReactNode
  }): ToastDefinition<P> {
    const renderWithControls = (id: string, props: P, options?: ToastOptions) => {
      const generation = peekToastGeneration(id, options?.document)
      const close = () => {
        referenceToast.dismiss(id, { document: options?.document, generation })
      }
      return config.render(props, { id, close })
    }

    const fn = ((props: P, options?: ToastOptions) => {
      const id = options?.id ?? generateToastId()
      const content = renderWithControls(id, props, options)
      const shown = referenceToast.show(content, {
        ...options,
        id,
        duration: options?.duration ?? config.duration,
        position: options?.position ?? config.position,
      })
      maybeAnnounce(options)
      return shown
    }) as ToastDefinition<P>

    fn.update = (id: string, props: P, options?: ToastOptions) => {
      const doc = resolveToastDocument(options?.document)
      const store = getToastStore(doc)
      if (!store.toasts.some(item => item.id === id && !item.exiting)) {
        toastDiagnostic(`toast.update: unknown id "${id}"`)
        return
      }
      const content = renderWithControls(id, props, options)
      referenceToast.update(id, content, {
        ...options,
        duration: options?.duration ?? config.duration,
        position: options?.position ?? config.position,
      })
      maybeAnnounce(options)
    }

    fn.dismiss = (id: string) => {
      referenceToast.dismiss(id)
    }

    return fn
  },
})
