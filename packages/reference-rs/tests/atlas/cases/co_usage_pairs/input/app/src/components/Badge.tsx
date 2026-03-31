import * as React from 'react'

export interface BadgeProps {
  children?: React.ReactNode
}

export function Badge({ children }: BadgeProps): React.ReactElement {
  return <span>{children}</span>
}