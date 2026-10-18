// Entry for the NEO-RECIPE-08 world. It takes the three probe nodes from the
// page and emits one responsive recipe class string onto each: base solid
// below the md query, outline at and above it, so the spec can prove the
// container width flips the painted variant.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const swatch = recipe({
  className: 'swatch',
  base: { color: 'ink' },
  variants: {
    variant: {
      solid: { backgroundColor: 'brand', color: 'paper' },
      outline: { backgroundColor: 'paper', color: 'brand' },
    },
  },
  defaultVariants: { variant: 'solid' },
})

const cls = swatch({ variant: { base: 'solid', md: 'outline' } })

el('narrow-probe').className = cls
el('wide-probe').className = cls
el('live-probe').className = cls
