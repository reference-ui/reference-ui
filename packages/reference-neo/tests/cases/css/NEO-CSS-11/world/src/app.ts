// Entry for the NEO-CSS-11 world. It takes a holder and a nested probe
// from the page and emits one css() class string each, so the holder owns
// the cased custom property while the nested probe reads it back through
// var() the way a lib author threads a branded value.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('holder').className = css({ '--testVariable0': 'hotpink' })
el('ink').className = css({ color: 'var(--testVariable0)' })
