// Local Card host for the NEO-SYNC-15 world. It takes the author's style
// props and emits them through the Div primitive, so the engine traces the
// Card site while the browser paints through the primitive runtime.
import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  id?: string
}

export function Card({ id, ...styleProps }: CardProps) {
  return <Div id={id} {...styleProps}>card</Div>
}
