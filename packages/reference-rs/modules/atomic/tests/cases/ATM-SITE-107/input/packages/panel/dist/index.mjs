/**
 * Built `@acme/panel` for ATM-SITE-107: a workspace package that keeps
 * `@reference-ui/react` external, so it renders through the app's runtime.
 */
import { jsx } from 'react/jsx-runtime'
import { Div } from '@reference-ui/react'

export function Panel(props) {
  return jsx(Div, { ...props })
}
