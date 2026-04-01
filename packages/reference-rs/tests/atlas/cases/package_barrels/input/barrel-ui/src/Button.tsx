import * as React from 'react'
import { PrivateChip } from './PrivateChip'

export interface ButtonProps {
  variant: 'solid' | 'ghost'
  children?: React.ReactNode
}

export function Button({ variant, children }: ButtonProps): React.ReactElement {
  return (
    <button data-variant={variant}>
      <PrivateChip>{variant}</PrivateChip>
      {children}
    </button>
  )
}
