// Entry for the CORE-EDGE-01 world. It takes the generated css runtime and
// paints three pseudo-state probes — hover, focus, and disabled — each bound
// to its element by id. The spec exercises each state for real, so every
// class here must resolve to a rule that paints only in that state.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('hoverable').className = css({
  _hover: { color: 'brand' },
})

el('focusable').className = css({
  _focus: { color: 'paper' },
})

el('disableable').className = css({
  _disabled: { color: 'ink' },
})
