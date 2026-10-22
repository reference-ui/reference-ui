/**
 * Test file.
 * A component that forwards StyleProps to a primitive: the sibling that must keep tracing while the
 * deeply nested source beside it is skipped. It inputs one primitive-forwarding component and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export function Card(props: StyleProps) {
  return <Div {...props} />
}
