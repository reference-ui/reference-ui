// Entry for the NEO-RECIPE-06 world. It takes one badge recipe with a
// size axis and emits its three selections onto the probe nodes, so the
// sheet, the DOM, and the paint all answer to the same class identity.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const badge = recipe({
  className: 'badge',
  base: { color: 'ink' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '20px' },
    },
  },
  defaultVariants: { size: 'sm' },
})

el('sm').className = badge({ size: 'sm' })
el('lg').className = badge({ size: 'lg' })
el('defaults').className = badge()
