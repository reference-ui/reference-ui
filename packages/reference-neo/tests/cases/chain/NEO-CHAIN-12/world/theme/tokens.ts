// The app's own tokens. `brand` replaces the base's value with a different one, and `quiet` writes the base's
// value unchanged. Both are local leaves over upstream leaves once the spec wires the extends in.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#bb0000' },
    quiet: { value: '#777777' },
  },
})
