// Entry for the NEO-COND-04 world. It takes the mode node from the page
// and emits one css() class string carrying a base color plus _light and
// _dark colors, so the element paints per the data-color-mode ancestor it
// sits under and falls back to the base color with no attribute set.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('mode').className = css({
  color: 'brand',
  _light: { color: 'ink' },
  _dark: { color: 'paper' },
})
