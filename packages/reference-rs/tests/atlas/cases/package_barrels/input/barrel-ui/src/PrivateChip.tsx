import * as React from 'react'

export interface PrivateChipProps {
  children?: React.ReactNode
}

export function PrivateChip({ children }: PrivateChipProps): React.ReactElement {
  return <span data-private-chip>{children}</span>
}