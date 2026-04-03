// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/MemberDescription.tsx
import { P } from '@reference-ui/react'

export function MemberDescription({ description }: { description?: string }) {
  if (!description) return null

  return (
    <P margin="0" color="reference.foreground">
      {description}
    </P>
  )
}
