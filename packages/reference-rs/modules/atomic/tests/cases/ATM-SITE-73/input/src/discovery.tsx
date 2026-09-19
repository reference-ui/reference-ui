import { css, Div } from '@reference-ui/react'

// A live `css()` call inside a function body extracts (v2 `calls.rs:702`).
export function theme() {
  return css({ color: 'red' })
}

// Literal calls nested in JSX expression containers extract (v2 `:657`),
// and several calls in one source each extract (v2 `:480`).
export function App() {
  const heading = css({ fontWeight: 'bold' })
  return <Div mt="2r" className={css({ padding: '4px' }) + ' ' + heading} />
}

// Multi-arg `css()` merges every arg with no cap (v2 `atomic.rs:1449`,
// 4-arg `:1596`).
export const combo = css(
  { margin: '1r' },
  { borderWidth: '1px' },
  { borderStyle: 'solid' },
  { borderColor: 'black' },
  { opacity: '0.5' },
)
