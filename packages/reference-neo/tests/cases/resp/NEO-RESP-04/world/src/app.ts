// app.ts — browser entry for the NEO-RESP-04 world. Takes the compiled
// css() runtime and emits the nested-condition width class onto four probes.
// The compiler extracts this same nested call, so build time and runtime agree.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({ width: '50px', sm: { md: { width: '60px' } } })

el('narrow-probe').className = cls
el('mid-probe').className = cls
el('wide-probe').className = cls
el('live-probe').className = cls
