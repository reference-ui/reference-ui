// Tokens for the NEO-WATCH-17 world. It takes no inputs and declares the one brand colour the probe paints with.
// It emits a tokens() fragment the sync compiles; the spec breaks it with a throw, then restores this file.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
