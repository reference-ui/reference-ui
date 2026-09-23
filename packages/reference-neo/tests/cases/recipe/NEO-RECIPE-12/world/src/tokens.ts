// tokens.ts — token fragment for the NEO-RECIPE-12 world. Takes the neo
// fragment collector and emits the viewport background and container
// border tokens the conjunction branches resolve. Values match the matrix
// recipe constants so the ported assertions read like the oracle's.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    viewportBackground: { value: '#1d4ed8' },
    containerBorder: { value: '#f97316' },
  },
})
