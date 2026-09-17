// Entry for the NEO-MERGE-03 world. It takes the pad node from the page
// and emits one css() class string from a shorthand plus its longhand, so
// both slots survive the merge and the longhand wins only its own side.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('pad').className = css({ padding: 'sm' }, { paddingTop: 'lg' })
