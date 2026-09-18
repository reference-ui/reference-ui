// Entry for the NEO-RECIPE-10 world. It takes the two probe nodes from the
// page and paints one with the recipe class plus a css() color utility and
// one with the recipe class alone, so the spec can prove the later utilities
// layer wins on the mixed node.
import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const flag = recipe({
  className: 'flag',
  base: { color: 'ink' },
  variants: {
    tone: {
      accent: { color: 'brand' },
      muted: { color: 'paper' },
    },
  },
  defaultVariants: { tone: 'muted' },
})

el('mixed').className = `${flag({ tone: 'accent' })} ${css({ color: 'paper' })}`
el('recipeonly').className = flag({ tone: 'accent' })
