import { css } from '@reference-ui/react'

export function App() {
  const c = css({
    mdDown: { display: 'none' },
    mdOnly: { px: '2r' },
    smToLg: { maxWidth: '80ch' },
    watDown: { color: 'red.500' },
  })
  return <div className={c} />
}
