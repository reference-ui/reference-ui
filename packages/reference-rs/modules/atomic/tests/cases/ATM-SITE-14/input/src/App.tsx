import { Div } from '@reference-ui/react'
import { css } from '@reference-ui/react'

export function App() {
  return <Div css={{ mt: '2r', _hover: { color: 'blue.600' } }} />
}

export const cls = css({ mt: '2r', _hover: { color: 'blue.600' } })
