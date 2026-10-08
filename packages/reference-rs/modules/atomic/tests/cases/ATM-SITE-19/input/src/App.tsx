import { Div } from '@reference-ui/react'

export function App() {
  return (
    <>
      <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
      <Div css={{ color: 'yellow.300' }} />
    </>
  )
}
