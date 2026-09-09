import * as React from 'react'

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

export interface ToastItemContextValue {
  id?: string
  dismissible?: boolean
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
  type?: string
  unstyled?: boolean
  className?: string
  style?: React.CSSProperties
  classNames?: ToastClassNames
  actionButtonStyle?: React.CSSProperties
  cancelButtonStyle?: React.CSSProperties
}

export const ToastItemContext = React.createContext<ToastItemContextValue>({})
