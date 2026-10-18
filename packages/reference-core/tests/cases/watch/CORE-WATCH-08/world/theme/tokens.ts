// Tokens for the CORE-WATCH-08 world. It takes no inputs and declares the one brand colour the probe paints with.
// It emits a tokens() fragment that the sync compiles into the generated sheet.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
