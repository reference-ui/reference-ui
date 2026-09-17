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

function pick(): string {
  return 'cherry'
}

el('target').className = css({ color: pick(), background: 'ocean' })
