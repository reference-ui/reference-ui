// Entry for the NEO-CSS-12 world. It takes three probe nodes from the page
// and emits one css() class string per rhythm shape, so each probe carries
// its integer, decimal, or fraction step the way a lib author writes them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('int').className = css({ marginTop: '4r' })
el('decimal').className = css({ paddingTop: '3.5r' })
el('fraction').className = css({ marginBottom: '1/2r' })
