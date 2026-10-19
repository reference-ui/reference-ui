// Entry for the CORE-CSS-01 world. It takes the generated css runtime and
// paints the base probe — color, background, and spacing from compiled plans
// — plus a hover probe for the conditional leg. The spec reads computed
// style off both, so every leaf here must resolve through the compiled plan.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('paint').className = css({
  color: 'brand',
  backgroundColor: 'ink',
  p: 'sm',
})

el('hoverable').className = css({
  _hover: { color: 'brand' },
})
