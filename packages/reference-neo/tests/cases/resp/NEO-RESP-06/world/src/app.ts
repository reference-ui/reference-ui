// app.ts — browser entry for the NEO-RESP-06 world. Takes the compiled
// css() runtime and emits the full responsive width class onto six probes.
// The compiler extracts this same array-plus-ranges call, so build time and
// runtime agree on all nine classes.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const cls = css({
  width: ['50px', '60px', '70px', '80px', '90px', '100px'],
  lgDown: { width: '110px' },
  mdDown: { width: '120px' },
  smDown: { width: '130px' },
})

el('c500-probe').className = cls
el('c700-probe').className = cls
el('c800-probe').className = cls
el('c1100-probe').className = cls
el('c1400-probe').className = cls
el('c1600-probe').className = cls
el('live-probe').className = cls
