// tone.ts — tone recipe fragment for the NEO-PGEN-17 world. It takes the
// fragment-time recipe() call and emits the tone definition sync merges into
// spec.recipes, so typegen mints ToneVariantProps and the bound entry types
// the exported variant alias as that union. The world paints the same brand
// root; this file only carries the recipe the alias legs assign against.
import { recipe } from '@reference-ui/neo'

recipe({
  className: 'tone',
  base: { display: 'inline-flex' },
  variants: {
    tone: {
      accent: { color: 'brand' },
      muted: { color: 'paper' },
    },
  },
  defaultVariants: { tone: 'muted' },
})
