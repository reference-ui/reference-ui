/**
 * Test file.
 * A component that forwards StyleProps to a primitive: the Card the STT-BOUND-01 clique re-exports.
 * It inputs one primitive-forwarding component and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export function Card(props: StyleProps) {
  return <Div {...props} />
}
