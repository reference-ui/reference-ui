/**
 * Built `@acme/panel` for ATM-SITE-102. It keeps `@reference-ui/react` external,
 * so it renders through whichever runtime that import resolves to: the app's.
 */
import { jsx } from 'react/jsx-runtime'
import { Div } from '@reference-ui/react'

export function Panel(props) {
  return jsx(Div, { ...props })
}
