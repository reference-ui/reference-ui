// Entry for the NEO-SITE-28 world. It styles the live node through the
// wrapper's `css`, the link node through the two-hop chain, and the miss
// node through the shadow wrapper's same-named imposter. The first two
// must paint; the miss must stay unpainted with zero diagnostics.
import { css } from './ui.js'
import { css as chained } from './chain.js'
import { css as fake } from './shadow.js'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('live').className = css({ color: 'cherry' })
el('link').className = chained({ color: 'ocean' })
el('miss').className = fake({ color: 'cherry' })
