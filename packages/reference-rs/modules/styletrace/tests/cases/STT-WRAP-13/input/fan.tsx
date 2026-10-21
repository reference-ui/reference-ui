/**
 * Test file.
 * A component whose props pass StyleProps through an alias that recurses twice per level, each time with a larger argument.
 * It inputs one fanning recursive alias and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Box<T> = { value: T }
type Bag<T> = { items: T }
type Fan<T> = T & (Fan<Box<T>> | Fan<Bag<T>>)
type FannedProps = Fan<StyleProps>

export function Fanned(props: FannedProps) {
  return <Div {...props} />
}
