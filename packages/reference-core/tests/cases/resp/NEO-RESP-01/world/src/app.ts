// app.ts — browser entry for the NEO-RESP-01 world. Takes the compiled
// css() runtime and emits the responsive width class onto three probes. The
// compiler extracts this same array call, so build time and runtime agree.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({ width: ['50px', '60px'] })

el('narrow-probe').className = cls
el('wide-probe').className = cls
el('live-probe').className = cls
