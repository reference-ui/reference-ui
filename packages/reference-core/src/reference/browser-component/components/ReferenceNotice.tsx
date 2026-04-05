// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceNotice.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import type * as React from 'react'
import { P } from '@reference-ui/react'

export function ReferenceNotice({ children }: { children: React.ReactNode }) {
  return (
    <P margin="0" color="reference.muted">
      {children}
    </P>
  )
}
