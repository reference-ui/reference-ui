// Entry for the PGEN-14 world. It takes the bound Div primitive and emits
// three probes: a style-free variant twin the tag recipe paints, a
// style-free dark island, and a passthrough probe carrying DOM props, a
// click handler, and a ref callback over both style paths. The handler
// flips a counter node; the ref callback marks the host it receives.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function PgenMeta() {
  return (
    <div id="meta-root">
      <Div id="meta-accent" variant="accent">
        accent
      </Div>
      <Div id="meta-dark" colorMode="dark">
        dark
      </Div>
      <Div
        id="meta-dom"
        aria-label="meta target"
        data-testid="meta-dom"
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
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenMeta />)
