import * as React from 'react'

export type ButtonVariant = 'solid' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  /** Visual style of the button. */
  variant?: ButtonVariant
  /** Size scale of the button. */
  size?: ButtonSize
  /** Prevents interaction when true. */
  disabled?: boolean
  /** Shows a loading indicator and prevents interaction. */
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
    <button disabled={disabled ?? loading} onClick={onClick}>
      {children}
    </button>
  )
}
