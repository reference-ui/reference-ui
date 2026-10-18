// Entry for the NEO-SITE-22 world. It takes the probe node and the page URL
// and emits one css() class string mixing a literal sibling with a logical
// spread of a const object behind a runtime-only guard, so the extractor
// must merge the right operand while the browser resolves the guard.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const params = new URLSearchParams(window.location.search)
const ok = params.get('spread') !== 'off'
const extra = { margin: '10px' }

el('target').className = css({ color: 'red', ...(ok && extra) })
