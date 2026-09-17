// Entry for the NEO-MERGE-08 world. It takes the probe node from the page
// and emits one css() class string from a flexDir shorthand beside an
// undefined longhand, so the defined value resolves alone while the hole
// drops without erasing its remapped shorthand.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({ flexDir: 'column', flexDirection: undefined })
