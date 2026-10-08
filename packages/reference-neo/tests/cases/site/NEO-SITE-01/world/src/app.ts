// Entry for the NEO-SITE-01 world. It takes the probe node and the page
// URL and emits one css() class whose color rides a literal ternary over
// a runtime-only flag, so the extractor must compile both arms while the
// browser resolves exactly one. With no query string the flag is true and
// the cherry arm paints.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const params = new URLSearchParams(window.location.search)
const flag = params.get('arm') !== 'ocean'

el('target').className = css({ color: flag ? 'cherry' : 'ocean' })
