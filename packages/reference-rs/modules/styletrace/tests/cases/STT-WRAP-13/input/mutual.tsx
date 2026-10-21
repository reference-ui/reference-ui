/**
 * Test file.
 * A component whose props pass StyleProps through two aliases that each expand into the other.
 * It inputs one mutually recursive pair and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Ping<T> = T & { ping?: string } & Pong<T>
type Pong<T> = { pong?: string } & Ping<T>
type PingedProps = Ping<StyleProps>

export function Pinged(props: PingedProps) {
  return <Div {...props} />
}
