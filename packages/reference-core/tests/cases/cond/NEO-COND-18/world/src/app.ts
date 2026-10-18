// app.ts — browser entry for the NEO-COND-18 world. Takes the compiled
// css() runtime and emits the adjacent and general sibling classes onto the
// two leaders. The compiler extracts both literal calls, so the peer and
// overlay rules exist in the sheet before the browser paints.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('adjacent-leader').className = css({
  '& + [data-slot=peer]': { marginLeft: '14px' },
})

el('general-leader').className = css({
  '& ~ [data-slot=overlay]': { paddingTop: '15px' },
})
