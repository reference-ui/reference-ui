import type * as React from 'react'
import { P } from '@reference-ui/react'

export function ReferenceNotice({ children }: { children: React.ReactNode }) {
  return (
    <P margin="0" color="reference.muted">
      {children}
    </P>
  )
}
