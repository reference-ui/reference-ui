/**
 * Mock fixture-demo-ui Stack used by plain_react_wrappers.
 * Mirrors the converted fixtures/demo-ui source: plain React with no
 * Reference connection, so chains ending here stay off the surface.
 */
import * as React from 'react'

export type StackDirection = 'horizontal' | 'vertical'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'

export type StackProps = {
  direction?: StackDirection
  gap?: number | string
  align?: StackAlign
  children: React.ReactNode
}

export function Stack({
  direction = 'vertical',
  gap = 8,
  align = 'stretch',
  children,
}: StackProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        gap,
        alignItems: align,
      }}
    >
      {children}
    </div>
  )
}
