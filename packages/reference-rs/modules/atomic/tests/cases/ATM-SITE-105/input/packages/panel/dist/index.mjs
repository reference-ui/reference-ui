/**
 * Built `@acme/panel` for ATM-SITE-105: a workspace package outside the sync's
 * sources that keeps `@reference-ui/react` external, so it renders through the
 * runtime that import resolves to: the app's.
 */
import { jsx } from 'react/jsx-runtime'
import { Div } from '@reference-ui/react'

export function Panel(props) {
  return jsx(Div, { ...props })
}
