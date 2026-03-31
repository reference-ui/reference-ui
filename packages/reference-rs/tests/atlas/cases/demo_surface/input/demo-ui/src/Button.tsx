import * as React from 'react'

export type ButtonVariant = 'solid' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function Button({
  variant = 'solid',
  size = 'md',
  disabled,
  loading,
  onClick,
  children,
}: ButtonProps): React.ReactElement {
  return (
    <button
      disabled={disabled ?? loading}
      onClick={onClick}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}
