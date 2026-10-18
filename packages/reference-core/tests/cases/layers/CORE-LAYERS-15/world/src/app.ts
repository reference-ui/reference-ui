// Entry for the CORE-LAYERS-15 world. It takes one own css() call on the own probe, so the
// consumer's sheet carries its own block next to the layer's utilities on every re-sync.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('own-probe').className = css({ color: '#15803d' })
