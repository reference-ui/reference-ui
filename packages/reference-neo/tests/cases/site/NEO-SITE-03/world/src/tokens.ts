// Tokens for the NEO-SITE-03 world. It takes no inputs and emits the color
// leaf the literal sibling names plus the spacing leaf the spread object
// carries, so both halves of the call paint through design tokens.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    cherry: { value: '#dc2626' },
  },
  spacing: {
    gap: { value: '12px' },
  },
})
