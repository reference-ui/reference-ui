// Entry for the NEO-RECIPE-09 world. It takes the three probe nodes from the
// page and emits one recipe class string per node: the loud tone, the quiet
// tone, and the loud tone again for the data-hover twin, so the spec can
// prove the variant's hover arm paints on the variant class alone.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const chip = recipe({
  className: 'chip',
  base: { color: 'ink' },
  variants: {
    tone: {
      loud: { backgroundColor: 'brand', _hover: { backgroundColor: 'ink' } },
      quiet: { backgroundColor: 'paper' },
    },
  },
  defaultVariants: { tone: 'quiet' },
})

el('loud').className = chip({ tone: 'loud' })
el('quiet').className = chip({ tone: 'quiet' })
el('hovertwin').className = chip({ tone: 'loud' })
