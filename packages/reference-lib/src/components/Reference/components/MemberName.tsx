/**
 * Member name: renders one member's identifier in the reference list.
 * Takes the name string; the row owns layout, this owns the label.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'

export function MemberName({ name }: { name: string }) {
  return (
    <Div
      color="reference.text"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.mono"
      weight="mono.semibold"
      fontSize="4r"
    >
      {name}
    </Div>
  )
}
