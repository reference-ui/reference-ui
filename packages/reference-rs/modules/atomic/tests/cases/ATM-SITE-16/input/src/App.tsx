import { Div } from '@reference-ui/react'
import { css } from '@reference-ui/react'

export function App() {
  return <Div color={theme.primary} />
}

export const cls = css({ color: theme.primary })
