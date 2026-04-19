import type * as React from 'react'
import { Div } from '@reference-ui/react'

export function ReferenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <Div
      css={{
        color: 'reference.text',
      }}
    >
      {children}
    </Div>
  )
}
