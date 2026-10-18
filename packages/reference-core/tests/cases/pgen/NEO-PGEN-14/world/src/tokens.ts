// Token fragment for the PGEN-14 world. It takes the neo fragment collector
// and emits the brand color the recipe and the passthrough probe paint,
// plus the spacing scale the css path resolves.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
