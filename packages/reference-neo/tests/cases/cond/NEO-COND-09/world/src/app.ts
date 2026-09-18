// Entry for the NEO-COND-09 world. It takes the button node from the
// page and emits one css() class string carrying a base ink color plus
// a comma key, so the button paints brand under focus alone or hover
// alone while its own base utility (not inheritance, which the UA
// button color would beat) holds the ink rest state.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('comma').className = css({
  color: 'ink',
  '&:focus, &:hover': { color: 'brand' },
})
