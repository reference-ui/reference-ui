// Entry for the NEO-CHAIN-03 world. It takes the generated css runtime and
// paints the four parallel probes: each chain endpoint background plus its
// own inner-base eyebrow. The app holds no local tokens, so every painted
// leaf proves adoption through the two extends entries.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('chain1-bg').className = css({ backgroundColor: 'metaExtendBg' })
el('chain1-eyebrow').className = css({ color: 'fixtureDemoAccent' })
el('chain2-bg').className = css({ backgroundColor: 'metaExtend2Bg' })
el('chain2-eyebrow').className = css({ color: 'secondaryDemoAccent' })
