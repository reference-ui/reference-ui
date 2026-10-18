// Token fragment for the CORE-LAYERS-17 layered upstream. It takes the core token collector and emits two colour
// tokens: upInk has a light and a dark leaf, and upSoft has a light and a dark leaf too, so the consumer's
// light-only override of upSoft has a base dark value to beat in dark mode.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    upInk: { value: '#be185d', dark: '#f9a8d4' },
    upSoft: { value: '#e5e7eb', dark: '#1f2937' },
  },
})
