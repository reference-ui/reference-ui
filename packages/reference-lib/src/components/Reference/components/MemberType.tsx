/**
 * Member type label: renders one member's type string beside its name.
 * Takes the preformatted label; formatting happens upstream.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div
      color="reference.highlight"
      minWidth="0"
      fontFamily="reference.sans"
      fontSize="3.5r"
      weight="sans.semibold"
      overflowWrap="anywhere"
    >
      {typeLabel}
    </Div>
  )
}
