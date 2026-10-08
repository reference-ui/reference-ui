// Entry for the NEO-COND-01 world. It takes the live and twin nodes from
// the page and emits one css() class string per node, so the live element
// carries a base color plus a hover color while the twin carries the hover
// color alone and paints through its data-hover attribute.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('live').className = css({
  color: 'ink',
  _hover: { color: 'brand' },
})

el('twin').className = css({
  _hover: { color: 'brand' },
})
