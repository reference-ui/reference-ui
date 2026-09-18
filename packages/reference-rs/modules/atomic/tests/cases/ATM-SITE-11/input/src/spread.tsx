import { css, Div } from '@reference-ui/react'

const base = { mt: '2r', bg: 'n300' }
const extra = { p: '1r' }

export function App() {
  return <Div {...base} color="red" />
}

export const styles = css({ ...extra })
