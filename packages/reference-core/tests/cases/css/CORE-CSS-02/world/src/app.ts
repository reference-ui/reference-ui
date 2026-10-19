// Entry for the CORE-CSS-02 world. It takes the generated css runtime and
// paints two container-query probes: one written as a literal @container
// rule, one as the responsive `r` sugar the runtime lowers to the identical
// query. The spec compares the pair, so both spellings must mint the same
// rule and paint.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// Build-time shape: extracted literally so the compiler emits the plan.
const wide = css({ '@container (min-width: 320px)': { color: 'paper' } })

// Author sugar: lowered at runtime to the identical query.
const sugared = css({ r: { 320: { color: 'paper' } } })

el('wide-probe').className = wide
el('narrow-probe').className = sugared
