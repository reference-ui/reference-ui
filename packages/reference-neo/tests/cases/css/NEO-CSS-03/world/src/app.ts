// Entry for the NEO-CSS-03 world. It takes the probe nodes from the page
// and emits one evicted css() class string plus its symmetric-order twin,
// so the alias probe carries a single bare class while the responsive
// probe carries both expansion members the way a lib author writes them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// Later alias evicts the earlier responsive expansion: one class.
const evicted = css({ width: { base: '50px', md: '60px' }, w: '70px' })

// Symmetric order: later responsive expansion evicts the earlier alias.
const responsive = css({ w: '70px', width: { base: '50px', md: '60px' } })

el('evicted-narrow').className = evicted
el('evicted-wide').className = evicted
el('responsive-narrow').className = responsive
el('responsive-wide').className = responsive
