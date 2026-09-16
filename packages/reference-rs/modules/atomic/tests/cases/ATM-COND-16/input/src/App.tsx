import { css } from '@reference-ui/react'

export function App() {
  const c = css({
    r: {
      'card/md': { p: '2r' },
    },
  })
  return (
    <Div container>
      <div className={c} />
    </Div>
  )
}
