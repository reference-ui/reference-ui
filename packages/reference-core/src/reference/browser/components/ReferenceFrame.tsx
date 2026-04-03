// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/ReferenceFrame.tsx
import type * as React from 'react'
import { Div } from '@reference-ui/react'

export function ReferenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
      }}
    >
      {children}
    </Div>
  )
}
