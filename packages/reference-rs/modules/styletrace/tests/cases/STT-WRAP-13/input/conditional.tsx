/**
 * Test file.
 * A component whose props pass StyleProps through a conditional whose branches both recurse, one with a growing argument.
 * It inputs one recursive conditional and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Box<T> = { value: T }
type Nest<T> = T extends string ? Nest<T> : T & Nest<Box<T>>
type NestedProps = Nest<StyleProps>

export function Nested(props: NestedProps) {
  return <Div {...props} />
}
