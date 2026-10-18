// Entry for the NEO-SITE-29 world. It takes the button binding from
// the sibling tokens module and emits one css() class for the node,
// so the folded spread paints while the unstyled control paints
// nothing. The explicit .js extension is the browser's address for
// the built file; the extractor resolves the same binding from the
// scanned sources.
import { css } from '@reference-ui/react'
import { button } from './tokens.js'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('live').className = css(button)
