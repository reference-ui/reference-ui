import * as React from 'react'

export interface ButtonProps {
  variant: 'solid' | 'ghost' | 'outline'
  disabled?: boolean
  children?: React.ReactNode
}

export function Button({ variant, disabled, children }: ButtonProps): React.ReactElement {
  return (
    <button data-variant={variant} disabled={disabled}>
      {children}
    </button>
  )
}
