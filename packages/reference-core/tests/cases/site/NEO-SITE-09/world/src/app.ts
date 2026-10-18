// Entry for the NEO-SITE-09 world. It takes the probe node from the page
// and emits one css() class string pairing a flat width with a string
// @media key, the escape hatch authors reach for outside the dialect.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('target').className = css({
  width: '50px',
  '@media (min-width: 400px)': { width: '60px' },
})
