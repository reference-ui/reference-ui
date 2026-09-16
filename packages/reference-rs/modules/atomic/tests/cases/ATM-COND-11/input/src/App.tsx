import { css } from '@reference-ui/react'

export function App() {
  const c = css({
    _osDark: { color: 'blue.600' },
    _motionReduce: { animation: 'none' },
    _print: { display: 'none' },
  })
  return <div className={c} />
}
