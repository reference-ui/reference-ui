// Entry for the NEO-SITE-06 world. It takes a local picker function and
// emits one css() class mixing a dynamic call value with a static
// sibling, so the call shape is a site but the dynamic key must warn and
// skip while the sibling still paints.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// A closed single-return helper would FOLD under entry 39 (ATM-SITE-31),
// so the dynamic pin needs a fence-refusing shape: a multi-statement body
// refuses with one located call-site warning while still returning cherry
// at runtime, where the missing plan keeps it a ghost-free miss.
function pick(): string {
  const choice = 'cherry'
  return choice
}

el('target').className = css({ color: pick(), background: 'ocean' })
