import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { referenceToast } from './toastRuntime'
import {
  ToastItemContext,
  type ToastAction as ToastActionConfig,
  type ToastActionOption,
  type ToastClassNames,
  type ToastIcons,
  type ToastType,
} from './toastContext'

export type { ToastActionOption, ToastClassNames, ToastIcons, ToastType } from './toastContext'

export type ToastRootProps = PrimitiveProps<'div'> & {
  unstyled?: boolean
}

export function ToastRoot({
  children,
  style,
  className,
  unstyled,
  ...props
}: ToastRootProps) {
  return (
    <Div
      data-reference-toast-root=""
      data-unstyled={unstyled ? 'true' : undefined}
      className={className}
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
  className,
  ...props
}: ToastTitleProps) {
  const itemContext = React.useContext(ToastItemContext)
  return (
    <Div
      data-reference-toast-title=""
      className={[itemContext?.classNames?.title, className].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {children}
    </Div>
  )
}

export type ToastDescriptionProps = PrimitiveProps<'div'>

export function ToastDescription({
  children,
  className,
  ...props
}: ToastDescriptionProps) {
  const itemContext = React.useContext(ToastItemContext)
  return (
    <Div
      data-reference-toast-description=""
      className={[itemContext?.classNames?.description, className].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {children}
    </Div>
  )
}

export type ToastActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function ToastAction({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastActionProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !itemContext?.id) return
    if (itemContext.dismissible === false) return
    referenceToast.dismiss(itemContext.id)
  }

  return (
    <button
      type="button"
      data-reference-toast-action=""
      className={[itemContext?.classNames?.actionButton, className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.actionButtonStyle, ...style }}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export type ToastCancelProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function ToastCancel({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastCancelProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !itemContext?.id) return
    if (itemContext.dismissible === false) return
    referenceToast.dismiss(itemContext.id)
  }

  return (
    <button
      type="button"
      data-reference-toast-cancel=""
      className={[itemContext?.classNames?.cancelButton, className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.cancelButtonStyle, ...style }}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export type ToastCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function ToastClose({
  children,
  onClick,
  style,
  className,
  ...props
}: ToastCloseProps) {
  const itemContext = React.useContext(ToastItemContext)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !itemContext?.id) return
    if (itemContext.dismissible === false) return
    referenceToast.dismiss(itemContext.id)
  }

  return (
    <button
      type="button"
      data-reference-toast-close=""
      aria-label="Close"
      className={[itemContext?.classNames?.closeButton, className].filter(Boolean).join(' ') || undefined}
      style={style}
      {...props}
      onClick={handleClick}
    >
      {children ?? itemContext?.icons?.close ?? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  )
}

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-green-500, #10b981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-red-500, #ef4444)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-amber-500, #f59e0b)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-blue-500, #3b82f6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function ToastLoader({ className }: { className?: string }) {
  return (
    <div data-reference-toast-loader="" className={className} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ ['--index' as string]: i }} />
      ))}
    </div>
  )
}

function typeIcon(type: ToastType, icons?: ToastIcons) {
  switch (type) {
    case 'success':
      return icons?.success ?? <SuccessIcon />
    case 'error':
      return icons?.error ?? <ErrorIcon />
    case 'warning':
      return icons?.warning ?? <WarningIcon />
    case 'info':
      return icons?.info ?? <InfoIcon />
    default:
      return null
  }
}

function isActionOption(action: ToastActionConfig): action is ToastActionOption {
  return (
    action != null &&
    typeof action === 'object' &&
    !React.isValidElement(action) &&
    'label' in (action as ToastActionOption)
  )
}

function renderToastAction(action: ToastActionConfig, kind: 'action' | 'cancel') {
  if (React.isValidElement(action)) return action
  if (!isActionOption(action)) return null
  if (kind === 'cancel') {
    return <ToastCancel onClick={action.onClick}>{action.label}</ToastCancel>
  }
  return <ToastAction onClick={action.onClick}>{action.label}</ToastAction>
}

export function DefaultToast({
  title,
  options,
}: {
  title: React.ReactNode
  options?: {
    description?: React.ReactNode
    closeButton?: boolean
    type?: ToastType
    action?: ToastActionConfig
    cancel?: ToastActionConfig
    icon?: React.ReactNode
    richColors?: boolean
    invert?: boolean
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    classNames?: ToastClassNames
  }
}) {
  const itemContext = React.useContext(ToastItemContext)
  const {
    description,
    closeButton = itemContext?.closeButton ?? false,
    type = (itemContext?.type as ToastType | undefined) ?? 'default',
    action,
    cancel,
    icon: customIcon,
    richColors = itemContext?.richColors,
    invert = itemContext?.invert,
    unstyled = itemContext?.unstyled,
    className,
    style,
    classNames,
  } = options ?? {}

  const resolvedClassNames = classNames ?? itemContext?.classNames
  const showIcon = customIcon !== undefined || type !== 'default'
  const resolvedTypeIcon = customIcon !== undefined ? customIcon : typeIcon(type, itemContext?.icons)
  const loadingIcon = itemContext?.icons?.loading

  return (
    <ToastRoot
      data-type={type}
      data-rich-colors={richColors ? 'true' : undefined}
      data-invert={invert ? 'true' : undefined}
      unstyled={unstyled}
      className={[resolvedClassNames?.toast, className, itemContext?.className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.style, ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        {showIcon && (
          <div
            data-reference-toast-icon=""
            data-type={type}
            className={resolvedClassNames?.icon}
          >
            {loadingIcon ? (
              <div data-reference-toast-loader="" className={resolvedClassNames?.loader}>
                {loadingIcon}
              </div>
            ) : (
              <ToastLoader className={resolvedClassNames?.loader} />
            )}
            <div data-reference-toast-type-icon="">
              {type === 'loading' ? null : resolvedTypeIcon}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {(action || cancel) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {action && renderToastAction(action, 'action')}
            {cancel && renderToastAction(cancel, 'cancel')}
          </div>
        )}
        {closeButton && <ToastClose data-corner="" />}
      </div>
    </ToastRoot>
  )
}

export const Toast = {
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Cancel: ToastCancel,
  Close: ToastClose,
  Default: DefaultToast,
  Loader: ToastLoader,
}
