import * as React from 'react'

export type UserBadgeProps = {
  count?: number
  children: React.ReactNode
}

export function UserBadge({ count, children }: UserBadgeProps): React.ReactElement {
  return (
    <span>
      {children}
      {count !== undefined && <span>{count}</span>}
    </span>
  )
}
