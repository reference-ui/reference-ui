// app.ts — browser entry for the NEO-RESP-08 world. Takes the compiled
// css() runtime and emits the numeric-breakpoint width classes onto three
// probes. The compiler extracts both the sugar and the direct query form, so
// build time and runtime agree on the same classes.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// Build-time shape: extracted literally so the compiler emits the plan.
const direct = css({ width: '50px', '@container (min-width: 300px)': { width: '60px' } })

// Author sugar: lowered at runtime to the identical query.
const sugared = css({ width: '50px', r: { 300: { width: '60px' } } })

el('narrow-probe').className = direct
el('wide-probe').className = sugared
el('live-probe').className = sugared
