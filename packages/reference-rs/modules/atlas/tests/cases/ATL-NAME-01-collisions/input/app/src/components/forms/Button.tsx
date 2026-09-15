import * as React from 'react'

export interface FormButtonProps {
  variant: 'submit' | 'reset'
  disabled?: boolean
  children?: React.ReactNode
}

export function Button({
  variant,
  disabled,
  children,
}: FormButtonProps): React.ReactElement {
  return (
    <button data-variant={variant} disabled={disabled}>
      {children}
    </button>
  )
}
