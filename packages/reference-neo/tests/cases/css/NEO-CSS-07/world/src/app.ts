// Entry for the NEO-CSS-07 world. It takes three probe nodes from the
// page and emits one css() class string per arbitrary spelling, so each
// probe carries a single utility class for its function value.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('rgba').className = css({ color: 'rgba(255,255,255,0.04)' })

el('mix').className = css({
  backgroundColor: 'color-mix(in oklch, currentColor 14%, transparent)',
})

el('calc').className = css({ width: 'calc(100% - 8px)' })
