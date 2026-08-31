import * as React from 'react'
import { referenceToast, type ToastItem } from '../ReferenceLibrary'

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
}

export interface ToastDefinition<P = void> {
  (props: P, options?: ToastOptions): string
  update: (id: string, props: P, options?: ToastOptions) => void
  dismiss: (id: string) => void
}

export const toast = {
  show(content: React.ReactNode, options?: ToastOptions): string {
    return referenceToast.show(content, options)
  },

  update(id: string, content: React.ReactNode, options?: ToastOptions): void {
    referenceToast.show(content, { ...options, id })
  },

  dismiss(id: string, options?: { document?: Document }): void {
    referenceToast.dismiss(id, options)
  },

  dismissAll(options?: { document?: Document }): void {
    referenceToast.dismissAll(options)
  },

  define<P = void>(config: {
    duration?: number | false
    position?: ToastPosition
    render: (props: P) => React.ReactNode
  }): ToastDefinition<P> {
    const fn = ((props: P, options?: ToastOptions) => {
      const content = config.render(props)
      return referenceToast.show(content, {
        duration: options?.duration ?? config.duration,
        position: options?.position ?? config.position,
        ...options,
      })
    }) as ToastDefinition<P>

    fn.update = (id: string, props: P, options?: ToastOptions) => {
      const content = config.render(props)
      referenceToast.show(content, {
        id,
        duration: options?.duration ?? config.duration,
        position: options?.position ?? config.position,
        ...options,
      })
    }

    fn.dismiss = (id: string) => {
      referenceToast.dismiss(id)
    }

    return fn
  },
}

export function ToastRoot({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} data-reference-toast-root="">
      {children}
    </div>
  )
}

export function ToastTitle({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} data-reference-toast-title="">
      {children}
    </div>
  )
}

export function ToastDescription({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} data-reference-toast-description="">
      {children}
    </div>
  )
}

export function ToastAction({
  children,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      {...props}
      data-reference-toast-action=""
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ToastClose({
  children,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      {...props}
      data-reference-toast-close=""
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export const Toast = {
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
}
