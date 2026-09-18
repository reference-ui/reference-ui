import { css, Div } from '@reference-ui/react'

const theme = { primary: 'teal' }
const rest = { mt: '2r' }
const pad = { p: '1r' }

export const ternary = css({ color: flag ? 'cherry' : 'ocean' })
export const member = css({ color: theme.primary })
export const spread = css({ bg: 'amber', ...rest })

export function App() {
  return <Div bg={on ? 'lime' : 'sky'} color={theme.primary} {...pad} />
}
