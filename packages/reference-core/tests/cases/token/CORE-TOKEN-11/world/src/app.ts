// Entry for the TOKEN-11 world. It takes the generated css runtime and
// paints the animation probe through the animations token by name.
// The keyframes the token names come from the motion fragment.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  animation: 'fade.quick',
})
