/**
 * `Panel` for ATM-SITE-102: a workspace wrapper that forwards its style props
 * into `Div` from `@reference-ui/react`, which resolves to the app's generated
 * runtime.
 */
import { Div, type DivProps } from '@reference-ui/react'

export function Panel(props: DivProps) {
  return <Div {...props} />
}
