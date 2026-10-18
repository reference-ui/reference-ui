// Entry for the TOKEN-13 world. It takes the generated css runtime and
// paints the grow animation onto the probe through the animations token.
// The negative delay holds the end state, so first paint is the `to` arm.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  animation: 'grow.once',
})
