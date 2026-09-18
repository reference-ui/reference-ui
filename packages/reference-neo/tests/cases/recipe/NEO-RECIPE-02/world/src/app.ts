// Entry for the NEO-RECIPE-02 world. It takes the three probe nodes from the
// page and emits one recipe class string per node: a bare call for both
// defaults, a partial call that defaults the size axis, and a fully explicit
// call, so the spec can compare defaulted paint against explicit paint.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const card = recipe({
  className: 'card',
  base: { color: 'ink' },
  variants: {
    size: {
      sm: { height: 'sm' },
      lg: { height: 'lg' },
    },
    tone: {
      accent: { color: 'brand' },
      muted: { color: 'paper' },
    },
  },
  defaultVariants: { size: 'lg', tone: 'muted' },
})

el('defaulted').className = card()
el('partial').className = card({ tone: 'accent' })
el('explicit').className = card({ size: 'sm', tone: 'accent' })
