// Entry for the NEO-MERGE-07 world. It takes the early, late, and plain
// nodes from the page and emits one css() class string per node, so both
// merged nodes pit an important ember against a plain ocean in opposite
// authorships while the control carries the plain ocean alone.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('early').className = css({ color: 'ember!' }, { color: 'ocean' })

el('late').className = css({ color: 'ocean' }, { color: 'ember!' })

el('plain').className = css({ color: 'ocean' })
