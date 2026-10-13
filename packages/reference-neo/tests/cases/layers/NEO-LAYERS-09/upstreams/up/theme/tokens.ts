// Token fragment for the NEO-LAYERS-09 layered upstream. It takes the neo token collector
// and emits one ink colour with a dark leaf, so the upstream's published component paints
// its own value in light mode and a different one in dark mode.

import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    upInk: { value: '#be185d', dark: '#f9a8d4' },
  },
})
