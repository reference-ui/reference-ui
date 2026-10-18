// tokens.ts — colors-only token fragment for the CORE-PGEN-22 world. It takes
// three color leaves and emits no spacing or radii categories, matching the
// PGEN type-station shape. The bound bake narrows this world's consumers
// against these declarations: known literals assign, foreign-system literals
// fail, hatches stay open.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
