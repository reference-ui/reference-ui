// Token fragment for the PRIM-10 world. It takes the neo fragment collector
// and emits the brand/ink/paper colors plus spacing and radii the surface
// probes type against. Mirrors the TYPE-01 token shape so the styled named
// graph carries real unions behind the re-exported names.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
  spacing: {
    sm: { value: '0.5rem' },
    lg: { value: '2rem' },
  },
  radii: {
    sm: { value: '0.25rem' },
    md: { value: '0.5rem' },
    full: { value: '9999px' },
  },
})
