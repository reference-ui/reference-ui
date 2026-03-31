import type * as React from 'react'
import { Div } from '@reference-ui/react'

export function ReferenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.border',
        borderRadius: '0.75rem',
        padding: '3r',
      }}
    >
      {children}
    </Div>
  )
}
