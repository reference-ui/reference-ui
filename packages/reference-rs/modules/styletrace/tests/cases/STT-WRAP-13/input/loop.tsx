/**
 * Test file.
 * A component whose props pass StyleProps through an alias that names itself with the same argument.
 * It inputs one self-referential alias and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Loop<T> = T | Loop<T>
type LoopedProps = Loop<StyleProps & { tone?: string }>

export function Looped(props: LoopedProps) {
  return <Div {...props} />
}
