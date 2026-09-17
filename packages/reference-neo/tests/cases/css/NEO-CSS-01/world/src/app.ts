import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('paint').className = css({
  color: 'brand',
  backgroundColor: 'ink',
  p: 'sm',
})

el('hoverable').className = css({
  _hover: { color: 'brand' },
})
