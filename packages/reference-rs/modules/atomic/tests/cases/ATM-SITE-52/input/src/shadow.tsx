import { css } from '@reference-ui/react'
import { Div } from '@reference-ui/react'

// Param shadows the host tag: fail-closed, silent.
export function Shadowed(Div: (props: object) => unknown) {
  return <Div mt="2r" />
}

// Control: the unshadowed host extracts.
export const live = <Div mt="2r" />

// Param shadows `undefined`: the leaf omits either way.
export function Undef(undefined: unknown) {
  css({ color: undefined })
  return undefined
}

// Control: bare `undefined` omits.
css({ color: undefined })

void Shadowed
void Undef
