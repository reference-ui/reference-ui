// The Card of the CORE-LAYERS-20 middle package, b. It takes props and children and emits a Span that styles itself
// with b's `bg="brand"` and holds its children, so a's Badge can render inside it the way b's own components wrap
// a's. The prebuilt fixture ships the same component as plain JS.
import type { ReactElement, ReactNode } from 'react'
import { Span } from '@reference-ui/react'

export function BCard({ id, children }: { id?: string; children?: ReactNode }): ReactElement {
  return (
    <Span id={id} bg="brand">
      {children}
    </Span>
  )
}
