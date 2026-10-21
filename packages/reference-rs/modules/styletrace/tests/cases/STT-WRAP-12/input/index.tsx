/**
 * Test file.
 * A component whose props pass StyleProps through two generic aliases that both name their parameter T.
 * It inputs one wrapper and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Wrap<T> = T & { tone?: string }
type Forward<T> = Wrap<T>
type CardProps = Forward<StyleProps>

export function Card(props: CardProps) {
  return <Div {...props} />
}
