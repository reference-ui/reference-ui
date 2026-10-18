// app.ts — browser entry for the NEO-CSS-15 world. Takes the compiled
// css() runtime and emits the viewport-probe classes onto the probe node.
// The compiler extracts the literal call, so the 840px branch exists in the
// sheet before the browser ever resizes.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const probe = css({
  paddingTop: '0px',
  backgroundColor: 'transparent',
  color: 'transparent',
  '@media (min-width: 840px)': {
    paddingTop: '20px',
    backgroundColor: 'rgb(124, 58, 237)',
    color: 'rgb(255, 255, 255)',
  },
})

el('probe').className = probe
