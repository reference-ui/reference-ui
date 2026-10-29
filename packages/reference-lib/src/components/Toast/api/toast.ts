/**
 * The toast callable: Sonner's show/update/dismiss vocabulary over the
 * record core. Elements show as custom content while anything else becomes
 * a default-toast title; variants stamp the type; custom mints the ID and
 * threads it into the render callback. Promise and define live in sibling
 * modules (imported here, calling back into showToast/updateToast — a
 * benign deferred-only cycle) so each entry point reads on its own.
 */
import * as React from 'react'
import { referenceToast } from '../state/reference'
import { generateToastId } from '../shared/ids'
import { maybeAnnounce } from './announce'
import { runToastPromise } from './promise'
import { defineToastDefinition } from './define'
import type {
  DefaultToastOptions,
  PromiseData,
  ToastApi,
  ToastControls,
  ToastDefinition,
  ToastOptions,
  ToastPosition,
} from '../types'

export function showToast(content: React.ReactNode, options?: DefaultToastOptions): string {
  const id = React.isValidElement(content)
    ? referenceToast.show(content, options)
    : referenceToast.show(undefined, { ...options, title: content })
  maybeAnnounce(options)
  return id
}

export function updateToast(id: string, content: React.ReactNode, options?: DefaultToastOptions): void {
  if (React.isValidElement(content)) {
    referenceToast.update(id, content, options)
  } else {
    referenceToast.update(id, undefined, { ...options, title: content })
  }
  maybeAnnounce(options)
}

const toastCallable = (message: React.ReactNode, options?: DefaultToastOptions): string => {
  return showToast(message, options)
}

export const toast: ToastApi = Object.assign(toastCallable, {
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
    return runToastPromise(promise, data, options)
  },

  define<P = void>(config: {
    duration?: number | false
    position?: ToastPosition
    render: (props: P, controls: ToastControls) => React.ReactNode
  }): ToastDefinition<P> {
    return defineToastDefinition(config)
  },
})
