// Entry for the CORE-LAYERS-02 world. It takes the consumer's own css() call on the
// upstream token name and applies its class to the token probe at runtime. Under layers
// the call warns at sync time and emits a raw declaration, while under extends it
// paints the upstream value.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('token-probe').className = css({ color: 'upInk' })
