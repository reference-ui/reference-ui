import { css, Div } from '@reference-ui/react'

// A pure helper returns an attribute bag. The fence folds the call at the
// spread. An arrow value would refuse the fold, so the handler key carries a
// static stand-in: only the key's spelling matters here.
function attrs() {
  return { readOnly: true, onPointerDown: 'press', css: { color: 'red' } }
}

export function App() {
  return <Div {...attrs()} padding="2r" />
}

// Control: the same folded object spread into css() keeps style-object semantics.
export const control = css({ ...attrs() })
