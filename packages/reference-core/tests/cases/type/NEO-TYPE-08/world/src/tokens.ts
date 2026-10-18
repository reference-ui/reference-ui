// tokens.ts — colors-only token fragment for the NEO-TYPE-08 world. It takes
// three color leaves and emits no spacing or radii categories, reproducing
// the extend-library Cause-B shape. The spec's generated css() call must
// accept spacing, radius, layout, and typography keys against this spec.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
