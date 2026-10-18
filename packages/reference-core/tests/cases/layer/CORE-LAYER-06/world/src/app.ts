import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const card = recipe({
  className: 'card',
  base: { color: 'brand' },
})

el('recipeprobe').className = card()

el('utilprobe').className = css({ color: 'brand' })
