// Entry for the CORE-LAYER-06 world. It takes the generated css runtime and
// recipe helper and paints two brand probes: one through a recipe base, one
// through a plain utility. Both consume the same token-layer var, so the
// spec proves token vars resolve inside recipe rules and utility rules alike.
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
