// Entry for the NEO-MERGE-02 world. It takes the paint node from the page
// and emits one css() class string from an alias plus its longhand, so the
// later longhand wins their shared background slot while both atoms compile.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('paint').className = css({ bg: 'sand', background: 'clay' })
