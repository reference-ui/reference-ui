// Entry for the NEO-CHAIN-05 world. It takes the generated css runtime and
// paints the three depth probes: the innermost base, the middle republish,
// and the apex-local leaf. The app holds no local tokens, so every painted
// leaf proves adoption through the single extends entry at its own depth.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('depth-a').className = css({ backgroundColor: 'fixtureDemoBg' })
el('depth-b').className = css({ backgroundColor: 'metaExtendBg' })
el('depth-c').className = css({ backgroundColor: 'apexBg' })
