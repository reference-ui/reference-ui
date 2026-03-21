import type * as React from 'react'
import { Div } from '@reference-ui/react'

export function ReferenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
        background: 'reference.background',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.border',
        borderRadius: '0.75rem',
        padding: 'reference.xl',
      }}
    >
      {children}
    </Div>
  )
}
