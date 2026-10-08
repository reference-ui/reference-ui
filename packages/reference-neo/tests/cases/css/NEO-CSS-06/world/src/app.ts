// Entry for the NEO-CSS-06 world. It takes the probe node from the page
// and emits one css() class string with token refs inside a gradient
// function, so the probe carries a single utility whose stops resolve
// through the token layer.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  backgroundImage: 'linear-gradient({colors.ember}, {colors.ocean})',
})
