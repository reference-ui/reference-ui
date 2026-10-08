// Entry for the NEO-MERGE-01 world. It takes the paint node from the page
// and emits one css() class string from two color args, so the later arg
// wins the shared color slot while both atoms stay compiled in the sheet.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('paint').className = css({ color: 'ember' }, { color: 'ocean' })
