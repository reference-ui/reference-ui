import * as React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

export type BadgeProps = {
  /** Semantic colour of the badge. */
  variant?: BadgeVariant
  /** Optional numeric count displayed alongside the label. */
  count?: number
  children: React.ReactNode
}

export function Badge({
  variant = 'default',
  count,
  children,
}: BadgeProps): React.ReactElement {
  return (
    <span data-variant={variant}>
      {children}
      {count !== undefined && <span>{count}</span>}
    </span>
  )
}
