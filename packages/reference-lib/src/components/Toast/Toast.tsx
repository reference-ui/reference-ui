import * as React from 'react'
import { Button, Div, type PrimitiveProps } from '@reference-ui/react'
import { referenceToast, ToastItemContext } from './ToastSystem'

export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastActionOption {
  label: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export interface ToastOptions {
  id?: string
  duration?: number | false
  position?: ToastPosition
  document?: Document
}

export interface DefaultToastOptions extends ToastOptions {
  description?: React.ReactNode
  closeButton?: boolean
  type?: ToastType
  action?: ToastActionOption
  cancel?: ToastActionOption
  icon?: React.ReactNode
}

export interface ToastDefinition<P = void> {
  (props: P, options?: ToastOptions): string
  update: (id: string, props: P, options?: ToastOptions) => void
  dismiss: (id: string) => void
}

export interface PromiseData<ToastData = any> {
  loading?: React.ReactNode
  success?: React.ReactNode | ((data: ToastData) => React.ReactNode)
  error?: React.ReactNode | ((error: any) => React.ReactNode)
  description?: React.ReactNode | ((data: ToastData) => React.ReactNode)
  finally?: () => void
}

export type ToastRootProps = PrimitiveProps<'div'>

export function ToastRoot({
  children,
  style,
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
      boxShadow="0 8px 24px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.08)"
      width="100%"
      boxSizing="border-box"
      position="relative"
      style={style}
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
      lineHeight="1.4"
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
      lineHeight="1.4"
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
      fontWeight="500"
      borderRadius="sm"
      bg="ui.button.background"
      color="ui.button.foreground"
      border="1px solid"
      borderColor="ui.field.border"
      cursor="pointer"
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
  style,
  ...props
}: ToastCloseProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && itemContext?.id) {
      referenceToast.dismiss(itemContext.id)
    }
  }

  return (
    <Button
      type="button"
      data-reference-toast-close=""
      aria-label="Close"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      p="1r"
      px={children ? '2r' : '1r'}
      fontSize="3r"
      borderRadius="sm"
      bg="transparent"
      color="design.text.light"
      border="none"
      cursor="pointer"
      onClick={handleClick}
      style={{
        transition: 'color 150ms ease, background 150ms ease',
        ...style,
      }}
      {...props}
    >
      {children ?? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </Button>
  )
}

export function DefaultToast({
  title,
  options,
}: {
  title: React.ReactNode
  options?: DefaultToastOptions
}) {
  const {
    description,
    closeButton = true,
    type = 'default',
    action,
    cancel,
    icon: customIcon,
  } = options ?? {}

  const renderIcon = () => {
    if (customIcon !== undefined) return customIcon
    switch (type) {
      case 'success':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--colors-green-500, #10b981)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'error':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--colors-red-500, #ef4444)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )
      case 'warning':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--colors-amber-500, #f59e0b)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case 'info':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--colors-blue-500, #3b82f6)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )
      case 'loading':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }}
          >
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
        )
      default:
        return null
    }
  }

  const icon = renderIcon()

  return (
    <ToastRoot data-type={type}>
      <Div display="flex" alignItems="flex-start" gap="2.5r" width="100%">
        {icon && (
          <Div display="flex" alignItems="center" mt="0.5r">
            {icon}
          </Div>
        )}
        <Div
          display="flex"
          flexDirection="column"
          gap="0.5r"
          flex="1"
          minWidth="0"
          pr={closeButton ? '6r' : '0'}
        >
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
          {(action || cancel) && (
            <Div display="flex" gap="2r" mt="1.5r" alignItems="center">
              {action && (
                <ToastAction onClick={action.onClick}>
                  {action.label}
                </ToastAction>
              )}
              {cancel && (
                <ToastClose onClick={cancel.onClick}>
                  {cancel.label}
                </ToastClose>
              )}
            </Div>
          )}
        </Div>
        {closeButton && (
          <ToastClose
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
            }}
          />
        )}
      </Div>
    </ToastRoot>
  )
}

function resolveContent(content: React.ReactNode, options?: DefaultToastOptions): React.ReactNode {
  if (React.isValidElement(content)) {
    return content
  }
  return <DefaultToast title={content} options={options} />
}

function showToast(content: React.ReactNode, options?: DefaultToastOptions): string {
  const resolved = resolveContent(content, options)
  return referenceToast.show(resolved, options)
}

function updateToast(id: string, content: React.ReactNode, options?: DefaultToastOptions): void {
  const resolved = resolveContent(content, options)
  referenceToast.show(resolved, { ...options, id })
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

  dismiss(id: string, options?: { document?: Document }): void {
    referenceToast.dismiss(id, options)
  },

  dismissAll(options?: { document?: Document }): void {
    referenceToast.dismissAll(options)
  },

  custom(render: (id: string) => React.ReactNode, options?: ToastOptions): string {
    const id = options?.id ?? `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const content = render(id)
    return referenceToast.show(content, { ...options, id })
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
  ): Promise<T> {
    const id = showToast(data.loading ?? 'Loading...', {
      ...options,
      type: 'loading',
      duration: false,
    })

    const p = typeof promise === 'function' ? promise() : promise

    return p
      .then((res) => {
        const successMsg =
          typeof data.success === 'function' ? data.success(res) : data.success
        const desc =
          typeof data.description === 'function' ? data.description(res) : data.description
        updateToast(id, successMsg ?? 'Completed successfully', {
          ...options,
          type: 'success',
          description: desc,
          duration: options?.duration ?? 4000,
        })
        return res
      })
      .catch((err) => {
        const errorMsg =
          typeof data.error === 'function' ? data.error(err) : data.error
        updateToast(id, errorMsg ?? 'An error occurred', {
          ...options,
          type: 'error',
          duration: options?.duration ?? 4000,
        })
        throw err
      })
      .finally(() => {
        data.finally?.()
      })
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
})

export const Toast = {
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
  Default: DefaultToast,
}

