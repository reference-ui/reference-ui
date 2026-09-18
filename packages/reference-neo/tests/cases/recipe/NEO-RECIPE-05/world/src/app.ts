// Entry for the NEO-RECIPE-05 world. It takes the four probe nodes from the
// page and paints each pair two ways: once through the recipe class string
// and once through css() over raw() output, so the spec can prove both paths
// paint identically. Extraction cannot see through raw(), so the twin css()
// literals below emit the utilities the raw-fed calls resolve at runtime.
import { css, recipe } from '@reference-ui/react'

// The typecheck view of recipe() omits raw(); the bundled runtime carries it
// (see the cook report for the proposed surface widening).
interface RawRecipe {
  (props?: Record<string, unknown>): string
  raw(props?: Record<string, unknown>): Record<string, unknown>
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const panel = recipe({
  className: 'panel',
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
}) as unknown as RawRecipe

css({ color: 'brand', p: 'lg', backgroundColor: 'ink' })
css({ color: 'paper', p: 'sm' })

el('classed').className = panel({ tone: 'accent', size: 'lg' })
el('rawfed').className = css(panel.raw({ tone: 'accent', size: 'lg' }))
el('classeddefault').className = panel()
el('rawfeddefault').className = css(panel.raw())
