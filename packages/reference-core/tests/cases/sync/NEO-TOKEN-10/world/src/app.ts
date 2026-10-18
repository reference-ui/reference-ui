// Entry for the NEO-TOKEN-10 world. It takes the probe node from the page
// and emits the font-macro class string, so the probe carries the family
// plus registry-weight expansion the way a lib author writes it.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('font').className = css({ font: 'sans' })
