import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const button = recipe({
  className: 'button',
  base: { color: 'ink' },
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
  defaultVariants: { tone: 'muted', size: 'sm' },
  compoundVariants: [{ tone: 'accent', size: 'lg', css: { backgroundColor: 'ink' } }],
})

el('accent').className = button({ tone: 'accent', size: 'sm' })
el('combo').className = button({ tone: 'accent', size: 'lg' })
el('muted').className = button({ tone: 'muted', size: 'sm' })
el('defaults').className = button()
