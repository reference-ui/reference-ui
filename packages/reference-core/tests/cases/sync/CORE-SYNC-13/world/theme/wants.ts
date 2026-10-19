// Style-want fixture for the SYNC-13 world: cls, chip over color, plus a recipe with variants.
// Takes the generated react entry and emits the wants the spec asserts in the output.
import { css, recipe } from '@reference-ui/styled'

export const cls = css({ color: 'brand' })

export const chip = recipe({
  className: 'chip',
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
