import * as React from 'react'
import { Button, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
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

export type ToastRootProps = PrimitiveProps<'div'>

export function ToastRoot({
  children,
  ...props
}: ToastRootProps) {
  return (
    <Div
      data-reference-toast-root=""
      display="flex"
      flexDirection="column"
      gap="1r"
      p="3.5r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      border="1px solid"
      borderColor="ui.dialog.border"
      borderRadius="md"
      boxShadow="0 4px 16px rgba(0,0,0,0.15)"
      minW="60r"
      maxW="90r"
      {...props}
    >
      {children}
    </Div>
  )
}

export type ToastTitleProps = PrimitiveProps<'div'>

export function ToastTitle({
  children,
  ...props
}: ToastTitleProps) {
  return (
    <Div
      data-reference-toast-title=""
      fontWeight="600"
      fontSize="3.5r"
      color="design.text.base"
      {...props}
    >
      {children}
    </Div>
  )
}

export type ToastDescriptionProps = PrimitiveProps<'div'>

export function ToastDescription({
  children,
  ...props
}: ToastDescriptionProps) {
  return (
    <Div
      data-reference-toast-description=""
      fontSize="3r"
      color="design.text.light"
      {...props}
    >
      {children}
    </Div>
  )
}

export type ToastActionProps = PrimitiveProps<'button'>

export function ToastAction({
  children,
  onClick,
  ...props
}: ToastActionProps) {
  return (
    <Button
      type="button"
      data-reference-toast-action=""
      px="2.5r"
      py="1r"
      fontSize="3r"
      borderRadius="sm"
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export type ToastCloseProps = PrimitiveProps<'button'>

export function ToastClose({
  children,
  onClick,
  ...props
}: ToastCloseProps) {
  return (
    <Button
      type="button"
      data-reference-toast-close=""
      px="2r"
      py="1r"
      fontSize="3r"
      borderRadius="sm"
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export const Toast = {
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
}
