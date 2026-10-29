/**
 * Member description line: renders the optional prose under a member's
 * name and type. Takes the description string; renders nothing when it
 * is absent. Backtick spans render as inline code.
 */
import * as React from 'react'
import { P } from '@reference-ui/react'
import { InlineCode } from './shared/InlineCode'

export function MemberDescription({ description }: { description?: string }) {
  if (!description) return null

  return (
    <P margin="0" color="reference.text">
      <InlineCode text={description} />
    </P>
  )
}
