// Entry for the CORE-LAYERS-01 world. It takes the consumer's own css() call and
// appends its class to the layered rank probe, so the own colour competes with
// the layer utility on one element. The layer and extends classes are static
// markup in index.html, so no script paints them and the layer proof stays a
// sheet-order and cascade proof.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const ownProbe = el('rank-layer-own')
ownProbe.className = `${ownProbe.className} ${css({ color: '#15803d' })}`
