// Entry for the NEO-COND-10 world. It takes the child node inside the focusable
// parent from the page and emits one css() class string carrying a base ink
// color plus a ':focus > &' parent key, so the child paints brand exactly while
// its own parent holds focus.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('child').className = css({
  color: 'ink',
  ':focus > &': { color: 'brand' },
})
