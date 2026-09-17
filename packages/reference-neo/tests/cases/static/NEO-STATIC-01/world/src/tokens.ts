// Tokens for the NEO-STATIC-01 world. They take no inputs and emit the two
// color leaves the staticCss map pre-generates, so runtime values find live
// atoms instead of missing classes.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ember: { value: '#ef4444' },
    gold: { value: '#f59e0b' },
  },
})
