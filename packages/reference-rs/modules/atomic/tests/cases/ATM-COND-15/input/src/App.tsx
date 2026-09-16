import { css } from '@reference-ui/react'

export function App() {
  const c = css({
    r: {
      md: { p: '1r' },
    },
  })
  return <div className={c} />
}
