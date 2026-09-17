// Entry for the NEO-RESP-03 world. It takes the probe nodes from the page
// and emits one per-prop responsive class string onto both, so the narrow
// probe and the wide probe differ only by the container they sit in.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({ width: { base: '50px', md: '60px' } })

el('probe-narrow').className = cls
el('probe-wide').className = cls
