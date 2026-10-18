// Entry for the NEO-CHAIN-02 world. It takes the generated css runtime and
// paints the four diamond probes: each branch-local background plus the
// shared inner-base eyebrow on both branches. The app holds no local
// tokens, so every painted leaf proves adoption through the extends entries.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('left-bg').className = css({ backgroundColor: 'metaExtendBg' })
el('left-eyebrow').className = css({ color: 'fixtureDemoAccent' })
el('right-bg').className = css({ backgroundColor: 'metaSiblingBg' })
el('right-eyebrow').className = css({ color: 'fixtureDemoAccent' })
