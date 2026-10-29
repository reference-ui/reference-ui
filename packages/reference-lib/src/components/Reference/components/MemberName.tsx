/**
 * Member name: renders one member's identifier in the reference list.
 * Takes the name string; the row owns layout, this owns the label. Call and
 * construct signatures have no identifier, so they read as plain labels.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'

const SIGNATURE_LABELS: Record<string, string> = {
  '[call]': 'Call signature',
  '[new]': 'Construct signature',
}

export function MemberName({ name }: { name: string }) {
  const label = SIGNATURE_LABELS[name]

  return (
    <Div
      color="reference.text"
      display="inline-flex"
      width="fit-content"
      fontFamily={label ? undefined : 'reference.mono'}
      weight={label ? 'sans.semibold' : 'mono.semibold'}
      fontSize="4r"
    >
      {label ?? name}
    </Div>
  )
}
