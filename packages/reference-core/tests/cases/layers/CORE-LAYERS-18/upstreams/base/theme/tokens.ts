// Token fragment for the CORE-LAYERS-18 upstream base. It declares three brand tokens the legs override:
// brandInk has a dark value a light-only override must replace, brandSoft is light-only, and brandAccent
// has its own dark value for the explicit-dark override.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brandInk: { value: '#1f2937', dark: '#e5e7eb' },
    brandSoft: { value: '#e5e7eb' },
    brandAccent: { value: '#0d9488', dark: '#5eead4' },
  },
})
