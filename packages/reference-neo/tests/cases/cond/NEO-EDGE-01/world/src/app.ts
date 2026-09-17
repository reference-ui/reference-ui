import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('hoverable').className = css({
  _hover: { color: 'brand' },
})

el('focusable').className = css({
  _focus: { color: 'paper' },
})

el('disableable').className = css({
  _disabled: { color: 'ink' },
})
