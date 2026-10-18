// Entry for the NEO-COND-05 world. It takes the sibling node after the input
// from the page and emits one css() class string carrying a base ink color
// plus an 'input:hover &' parent key, so the sheet composes the hovered-input
// ancestor on the conditioned utility while the sibling rests on ink.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('sibling').className = css({
  color: 'ink',
  'input:hover &': { color: 'brand' },
})
