// Entry for the NEO-CSS-08 world. It takes four probe nodes from the page
// and emits one css() class string per spelling, so each important probe
// carries its important class beside the later plain blue while the content
// probe carries the quoted string alone and unimportant.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const bang = css({ color: 'red!' })
const spaced = css({ color: 'red !important' })
const upper = css({ color: 'red!IMPORTANT' })
const plain = css({ color: 'yellow' })

el('bang').className = `${bang} ${plain}`
el('spaced').className = `${spaced} ${plain}`
el('upper').className = `${upper} ${plain}`
el('plain').className = plain
el('content').className = css({ content: '"hello!"' })
