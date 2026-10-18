// Entry for the TOKEN-09 world. It takes the generated css runtime and
// paints the private token by name spelling and by curly-ref spelling.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  color: '_private.secret',
})

el('ref-probe').className = css({
  backgroundColor: '{colors._private.secret}',
})
