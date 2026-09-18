// Entry for the PRIM-08 world. It takes the generated Div primitive and emits
// a passthrough probe (DOM props, click handler, ref callback, both style
// paths) plus a no-polymorphism probe carrying an as prop. The handler flips
// a counter node; the ref callback marks the host it receives.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div
        id="dom"
        aria-label="prim target"
        data-testid="prim-dom"
        title="hi"
        color="brand"
        css={{ p: 'sm' }}
        onClick={() => {
          const counter = document.getElementById('clicks')
          if (counter) counter.textContent = 'clicked'
        }}
        ref={(node: unknown) => {
          if (node instanceof HTMLElement) node.dataset.ref = 'seen'
        }}
      >
        passthrough
      </Div>
      <div id="clicks">unclicked</div>
      <Div id="no-poly" as="span">
        own tag
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
