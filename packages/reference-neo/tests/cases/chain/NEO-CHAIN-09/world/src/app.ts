// Entry for the NEO-CHAIN-09 app. It takes the generated css runtime and paints two probes: the x probe
// in the token the diamond contests, and the cLeaf probe in the leaf only branch c writes. The app holds
// no local tokens, so both paints prove adoption through the extends entries the spec wires mid-run.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe-x').className = css({ color: 'x' })
el('probe-c-leaf').className = css({ color: 'cLeaf' })
