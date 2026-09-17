// Tokens for the NEO-STATIC-03 world. They take no inputs and emit the ember
// leaf the static set covers plus the gold leaf it leaves out, so the miss
// probe fails on set membership rather than on a missing token.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ember: { value: '#ef4444' },
    gold: { value: '#f59e0b' },
  },
})
