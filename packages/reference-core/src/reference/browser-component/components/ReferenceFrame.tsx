// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceFrame.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
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
