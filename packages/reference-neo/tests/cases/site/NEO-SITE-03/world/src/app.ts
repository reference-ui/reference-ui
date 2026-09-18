// Entry for the NEO-SITE-03 world. It takes the probe node from the page
// and emits one css() class mixing a literal sibling with an identifier
// spread of a const object, the way authors compose shared style blocks.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const rest = { mt: 'gap' }

el('target').className = css({ color: 'cherry', ...rest })
