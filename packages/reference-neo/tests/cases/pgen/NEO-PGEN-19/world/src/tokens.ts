// tokens.ts — colors-only token fragment for the NEO-PGEN-19 world. It takes
// three color leaves and emits no spacing or radii categories, matching the
// TYPE-08 cause-B shape. The PGEN type cases prove E4 against these narrow
// declarations: known literals assign, mistyped values fail, hatches stay open.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
