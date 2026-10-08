// Entry for the NEO-RECIPE-04 world. It takes the probe nodes from the page
// and emits one recipe class string per node across the predicate matrix: the
// full compound selection, each single-predicate miss, and the compound
// selection again under hover and dark conditions, so the spec can prove the
// compound fires only when every predicate holds.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const banner = recipe({
  className: 'banner',
  base: { color: 'paper' },
  variants: {
    tone: {
      accent: { color: 'brand' },
      muted: { color: 'paper' },
    },
    size: {
      sm: { p: 'sm' },
      lg: { p: 'lg' },
    },
  },
  compoundVariants: [
    {
      tone: 'accent',
      size: 'lg',
      css: {
        backgroundColor: 'ink',
        _hover: { backgroundColor: 'brand' },
        _dark: { color: 'ink' },
      },
    },
  ],
})

el('combo').className = banner({ tone: 'accent', size: 'lg' })
el('accentonly').className = banner({ tone: 'accent', size: 'sm' })
el('lgonly').className = banner({ tone: 'muted', size: 'lg' })
el('hovertwin').className = banner({ tone: 'accent', size: 'lg' })
el('comboindark').className = banner({ tone: 'accent', size: 'lg' })
el('partialindark').className = banner({ tone: 'accent', size: 'sm' })
