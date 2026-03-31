import * as React from 'react'

export type BadgeProps = {
  count?: number
  children: React.ReactNode
}

export function Badge({ count, children }: BadgeProps): React.ReactElement {
  return (
    <span>
      {children}
      {count !== undefined && <span>{count}</span>}
    </span>
  )
}