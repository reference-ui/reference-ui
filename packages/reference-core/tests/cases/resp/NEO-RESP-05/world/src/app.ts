// app.ts — browser entry for the NEO-RESP-05 world. Takes the compiled
// css() runtime and emits one range-bound width class per probe pair. The
// compiler extracts these same three calls, so build time and runtime agree.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const clsDown = css({ width: '50px', mdDown: { width: '60px' } })
const clsOnly = css({ width: '50px', mdOnly: { width: '70px' } })
const clsRange = css({ width: '50px', smToLg: { width: '80px' } })

el('down767-probe').className = clsDown
el('down768-probe').className = clsDown
el('only767-probe').className = clsOnly
el('only768-probe').className = clsOnly
el('only1023-probe').className = clsOnly
el('only1024-probe').className = clsOnly
el('range639-probe').className = clsRange
el('range640-probe').className = clsRange
el('range1023-probe').className = clsRange
el('range1024-probe').className = clsRange
el('live-probe').className = clsOnly
