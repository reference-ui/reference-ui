// Entry for the NEO-CHAIN-06 world. It takes the generated css runtime and
// paints the two adoption probes from upstream leaves: the copy in accent,
// the panel on paper. No local tokens exist here, so every painted leaf
// proves adoption through the extends entry the spec wires mid-run.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('real-copy').className = css({ color: 'realAccent' })
el('real-panel').className = css({ backgroundColor: 'realPaper' })
