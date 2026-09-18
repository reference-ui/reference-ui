// Entry for the NEO-RECIPE-11 world. It takes the two probe nodes from the
// page and paints them with the closed classes the className-less chipRecipe
// emits, so the spec can prove inference produces the same paintable output
// an explicit identity would. The recipe call itself is the extraction
// source; the class strings below are its inferred stems, asserted in the
// sheet node-side before any pixel is read.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const chipRecipe = recipe({
  base: { color: 'ink' },
  variants: {
    tone: {
      loud: { backgroundColor: 'brand' },
      quiet: { backgroundColor: 'paper' },
    },
  },
  defaultVariants: { tone: 'quiet' },
})
void chipRecipe

el('loud').className = 'neo-recipe__chip__base neo-recipe__chip_t_loud'
el('quiet').className = 'neo-recipe__chip__base neo-recipe__chip_t_quiet'
