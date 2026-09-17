// Entry for the NEO-SITE-08 world. It takes the probe node from the page
// and emits one css() class string mixing a literal sibling with a logical
// spread of a const object, the way authors gate optional style blocks.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const ok = true
const extra = { margin: '10px' }

el('target').className = css({ color: 'red', ...(ok && extra) })
