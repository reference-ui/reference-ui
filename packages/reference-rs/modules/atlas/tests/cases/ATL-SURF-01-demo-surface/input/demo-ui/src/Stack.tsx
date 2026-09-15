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
