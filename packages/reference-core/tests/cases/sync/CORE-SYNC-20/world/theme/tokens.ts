// Token fragment for the SYNC-20 world: one brand color through tokens().
// It gives the canonical sync a fragment to evaluate, takes nothing, and emits the colors tokens the sheet carries.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
