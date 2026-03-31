import * as React from 'react'

export type ButtonVariant = 'solid' | 'ghost'

export type ButtonProps = {
  variant?: ButtonVariant
  children: React.ReactNode
}

export function Button({ variant = 'solid', children }: ButtonProps): React.ReactElement {
  return <button data-variant={variant}>{children}</button>
}
