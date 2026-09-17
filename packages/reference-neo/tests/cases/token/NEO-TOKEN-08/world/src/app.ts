// Entry for the TOKEN-08 world. It takes the generated css runtime and
// paints the negative-token and negative-rhythm margin probes.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('token-neg').className = css({
  marginTop: '-sm',
})

el('rhythm-neg').className = css({
  marginTop: '-1r',
})

el('scaled-neg').className = css({
  marginTop: '-4r',
})
