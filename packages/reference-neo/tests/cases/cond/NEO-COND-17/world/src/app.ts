// Entry for the NEO-COND-17 world. It takes the scoped host node from
// the page and emits one css() class string carrying a base ink color
// plus a comma key whose bare `:only-child` member must scope under the
// class, so the host and its only-child paint brand while an unscoped
// only-child elsewhere stays ink.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('scoped').className = css({
  color: 'ink',
  '&:not(:first-child), :only-child': { color: 'brand' },
})
