import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const button = recipe({
  className: 'button',
  base: { color: 'ink' },
  variants: {
    size: {
      sm: { p: 'sm' },
    },
  },
  defaultVariants: { size: 'sm' },
})

// Recipe plus a brand utility: the utility must override the base colour
// because the utilities layer follows the recipes layer.
el('host').className = `${button()} ${css({ color: 'brand' })}`

// Recipe alone: paints the base so the override has something to beat.
el('recipeonly').className = button()
