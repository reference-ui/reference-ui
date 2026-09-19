// Entry for the NEO-COND-16 world. It styles an icon-only button and a
// text button with one class carrying base inline padding plus the nested
// :where(:has()) collapse, so only the icon-only button collapses.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({
  paddingInline: '20px',
  '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': {
    paddingInline: '0',
  },
})
el('iconOnly').className = cls
el('text').className = cls
