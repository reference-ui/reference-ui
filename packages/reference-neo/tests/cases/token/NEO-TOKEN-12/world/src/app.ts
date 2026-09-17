// Entry for the TOKEN-12 world. It takes the generated css runtime and
// paints the padding probe with two token refs inside one value.
// Each ref resolves to its own spacing var on its own sides.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  padding: '{spacing.1r} {spacing.2r}',
})
