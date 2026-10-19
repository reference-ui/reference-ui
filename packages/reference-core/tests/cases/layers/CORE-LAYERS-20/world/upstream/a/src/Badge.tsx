// The Badge of the CORE-LAYERS-20 base package, a. It takes props and children and emits a Span that styles itself
// with a's `bg="brand"`, so a's sync emits the rule. The prebuilt fixture ships the same component as plain JS.
import type { ReactElement, ReactNode } from 'react'
import { Span } from '@reference-ui/react'

export function ABadge({ id, children }: { id?: string; children?: ReactNode }): ReactElement {
  return (
    <Span id={id} bg="brand">
      {children}
    </Span>
  )
}
