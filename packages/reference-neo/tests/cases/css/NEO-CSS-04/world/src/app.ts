// Entry for the NEO-CSS-04 world. It takes the probe node from the page
// and emits one css() class string with a numeric leaf per unit policy,
// so the probe carries a pixel width beside bare unitless and custom-prop
// numbers the way a lib author writes them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  width: 42,
  opacity: 1,
  zIndex: 0,
  '--foo': 42,
})
