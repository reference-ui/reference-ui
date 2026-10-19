/**
 * Reference notice: the muted callout for status text. Takes children
 * only; the loading, error, and empty states render their copy inside it.
 */
import * as React from 'react'
import { P } from '@reference-ui/react'

export function ReferenceNotice({ children }: { children: React.ReactNode }) {
  return (
    <P margin="0" color="reference.textLight">
      {children}
    </P>
  )
}
