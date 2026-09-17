// Entry for the NEO-COND-07 world. It takes the three page nodes and
// emits one quoted-attribute css() class shared by both paragraphs plus
// one _expanded class for the twin button, so only the paragraph whose
// data-state reads open paints brand while the twin paints accent.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const attrClass = css({
  "&[data-state='open']": { color: 'brand' },
})
el('open').className = attrClass
el('closed').className = attrClass

el('expanded').className = css({
  _expanded: { color: 'accent' },
})
