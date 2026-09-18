import { Div, createRoot } from '@reference-ui/react'

// Extraction source and browser entry in one: the compiler reads this file's
// JSX attrs to emit the style plans (including the css-prop _dark override),
// and the harness transpiles it to dist/ for the browser. Three depths: the
// default surface, a dark island, and a nested light island flipping back.
export function Prim() {
  return (
    <Div id="surface">
      <Div id="ink-light" color="ink">
        light ink
      </Div>
      <Div id="brand-light" color="brand" css={{ _dark: { color: 'paper' } }}>
        light brand
      </Div>
      <Div id="dark-island" colorMode="dark">
        <Div id="ink-dark" color="ink">
          dark ink
        </Div>
        <Div id="brand-dark" color="brand" css={{ _dark: { color: 'paper' } }}>
          dark brand
        </Div>
        <Div id="light-island" colorMode="light">
          <Div id="ink-nested" color="ink">
            nested ink
          </Div>
          <Div id="brand-nested" color="brand" css={{ _dark: { color: 'paper' } }}>
            nested brand
          </Div>
        </Div>
      </Div>
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
