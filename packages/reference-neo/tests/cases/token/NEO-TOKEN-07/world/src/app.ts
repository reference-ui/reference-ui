// Entry for the TOKEN-07 world. It takes the generated css runtime and
// paints the named-decimal, decimal-rhythm, and fraction-rhythm probes.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('named').className = css({
  p: '0.5',
})

el('decimal').className = css({
  p: '0.5r',
})

el('fraction').className = css({
  p: '1/2r',
})
