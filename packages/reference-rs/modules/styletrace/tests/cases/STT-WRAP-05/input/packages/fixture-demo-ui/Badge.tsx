/**
 * Mock fixture-demo-ui Badge used by plain_react_wrappers.
 * Mirrors the converted fixtures/demo-ui source: plain React with no
 * Reference connection, so chains ending here stay off the surface.
 */
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
