import * as React from 'react'

export interface ButtonProps {
  variant: 'solid' | 'ghost'
  children?: React.ReactNode
}

export default function Button({ variant, children }: ButtonProps): React.ReactElement {
  return <button data-variant={variant}>{children}</button>
}