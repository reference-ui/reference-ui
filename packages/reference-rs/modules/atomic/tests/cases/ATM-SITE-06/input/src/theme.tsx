import { css, Div } from '@reference-ui/react'

const theme = { primary: 'n300' }
const space = '2r'

export function App() {
  return <Div color={theme.primary} mt={space} />
}

export const styles = css({ color: theme.primary })
