/**
 * Built `@acme/panel` for ATM-SITE-106: a workspace package outside the sync's
 * sources that keeps `@reference-ui/react` external, so it renders through the
 * runtime that import resolves to: the app's, once the first sync generates it.
 */
import { jsx } from 'react/jsx-runtime'
import { Div } from '@reference-ui/react'

export function Panel(props) {
  return jsx(Div, { ...props })
}
