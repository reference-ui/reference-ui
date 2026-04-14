// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/MemberDescription.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { P } from '@reference-ui/react'

export function MemberDescription({ description }: { description?: string }) {
  if (!description) return null

  return (
    <P margin="0" color="reference.text">
      {description} 
    </P>
  )
}
