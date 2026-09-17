// Entry for the NEO-CSS-10 world. It takes three probe nodes from the page
// and emits one css() class string per macro, so each probe carries the
// expanded utility set for size, font, or weight the way a lib author
// writes them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('size').className = css({ size: '20px' })
el('font').className = css({ font: 'sans' })
el('weight').className = css({ weight: 'bold' })
