import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// Redefines the brand var on the dark probe, then consumes it: the utility
// declaration must beat the token island's dark value for the same var.
el('varprobe').className = css({
  '--colors-brand': '#00aa00',
  color: 'brand',
})

// No override: consumes whatever the dark island provides.
el('darkcontrol').className = css({
  color: 'brand',
})

// Chip class plus a brand utility: the (0,1,0) utility must beat the
// (0,2,0) tag rule because the utilities layer outranks global.
el('toneprobe').className = `ref-chip ${css({ color: 'brand' })}`
