// Entry for the CORE-CHAIN-09 app. It takes the generated css runtime and paints three probes: the x probe in the
// token branch b overrides, the y probe in the token branch c overrides, and the cLeaf probe in the leaf only
// branch c writes. The app holds no local tokens, so every paint proves adoption through the extends entries the
// spec wires mid-run.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe-x').className = css({ color: 'x' })
el('probe-y').className = css({ color: 'y' })
el('probe-c-leaf').className = css({ color: 'cLeaf' })
