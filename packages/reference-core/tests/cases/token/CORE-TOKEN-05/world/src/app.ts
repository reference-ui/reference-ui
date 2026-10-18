import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('top').className = css({
  color: 'brand',
})

el('nested').className = css({
  color: 'brand',
})
