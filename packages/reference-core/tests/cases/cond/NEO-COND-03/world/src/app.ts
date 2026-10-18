// Entry for the NEO-COND-03 world. It takes the five probe nodes from
// the page and emits one css() class string onto all of them, so every
// probe shares a base ink color plus a hover-over-disabled arm that
// paints brand only when the hover list and the disabled list both hit.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({
  color: 'ink',
  _hover: { _disabled: { color: 'brand' } },
})

el('full').className = cls
el('aria').className = cls
el('hoverOnly').className = cls
el('disabledOnly').className = cls
el('live').className = cls
