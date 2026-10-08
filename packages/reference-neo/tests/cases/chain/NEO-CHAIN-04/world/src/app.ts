// Entry for the NEO-CHAIN-04 world. It takes the generated css runtime and
// paints the four parallel probes: each upstream's background and one accent
// plus the shared order leaf, which must carry the second entry's value.
// The app holds no local tokens, so every painted leaf proves adoption
// through the two extends entries and their declared order.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('first-bg').className = css({ backgroundColor: 'fixtureDemoBg' })
el('first-eyebrow').className = css({ color: 'fixtureDemoAccent' })
el('second-bg').className = css({ backgroundColor: 'secondaryDemoBg' })
el('order-probe').className = css({ color: 'orderMark' })
