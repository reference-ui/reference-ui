// Entry for the NEO-MERGE-04 world. It takes the edge node from the page
// and emits one css() class string from a borderBottom shorthand plus a
// sibling borderColor, so width and style paint while the color survives.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('edge').className = css({ borderBottom: '1px solid', borderColor: 'slate' })
