// Entry for the NEO-CHAIN-01 world. It takes the generated css runtime and
// paints the three transitive probes: the outer-local background and copy
// plus the inner-base eyebrow the outer fragment republishes. No local
// tokens exist here, so every painted leaf proves adoption through the
// outer extends entry alone.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('demo-bg').className = css({ backgroundColor: 'metaExtendBg' })
el('demo-copy').className = css({ color: 'metaExtendText' })
el('demo-eyebrow').className = css({ color: 'fixtureDemoAccent' })
