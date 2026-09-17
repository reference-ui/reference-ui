// Entry for the NEO-COND-13 world. It takes the sibling node from the
// page and emits one css() call carrying an unknown _hovr arm plus a
// base ink sibling, so the engine warns on the typo while the sibling
// still compiles and the paragraph paints ink without any ghost class.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('sibling').className = css({
  _hovr: { color: 'brand' },
  color: 'ink',
})
