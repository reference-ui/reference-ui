// Entry for the TOKEN-15 world. It takes the generated css runtime and
// paints the quad-rhythm and unit-rhythm probes against the rescaled root.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('quad').className = css({
  p: '4r',
})

el('unit').className = css({
  p: '1r',
})
