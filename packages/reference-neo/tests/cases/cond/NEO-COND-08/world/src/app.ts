// Entry for the NEO-COND-08 world. It takes the quote node from the
// page and emits one css() class string carrying a hover color plus
// quoted before/after contents and colors, so the paragraph paints ink
// at rest while its pseudo-elements carry their own quoted contents.
// The before content hides a bang inside its quotes, proving quoted
// bangs never mark importance the way LEAF-10 requires.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('quote').className = css({
  _hover: { color: 'accent' },
  _before: { content: '"yes!"', color: 'brand' },
  _after: { content: '"[end]"', color: 'accent' },
})
