// Entry for the NEO-COND-11 world. It takes the group child and peer
// sibling nodes from the page and emits one css() class string per
// node, so each carries a base ink color plus its group or peer brand
// arm while the plain paragraph stays unstyled for releasing hovers.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('groupTarget').className = css({
  color: 'ink',
  _groupHover: { color: 'brand' },
})

el('peerTarget').className = css({
  color: 'ink',
  _peerFocus: { color: 'brand' },
})
