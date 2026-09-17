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
