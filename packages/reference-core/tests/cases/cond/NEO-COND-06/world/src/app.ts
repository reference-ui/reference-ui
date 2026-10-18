// Entry for the NEO-COND-06 world. It takes the parent node from the
// page and emits one css() class string carrying a child-combinator
// color, so direct p children paint brand while deeper descendants
// keep whatever the page baseline gives them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('parent').className = css({
  '& > p': { color: 'brand' },
})
