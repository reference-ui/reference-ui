/**
 * `Card` for ATM-SITE-101: a workspace wrapper that forwards its style props
 * into the app's own `Div`, so it renders through this compile's runtime.
 */
import { Div, type DivProps } from '@reference-ui/react'

export function Card(props: DivProps) {
  return <Div {...props} />
}
