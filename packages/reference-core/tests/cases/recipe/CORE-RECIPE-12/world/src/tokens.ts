// tokens.ts — token fragment for the CORE-RECIPE-12 world. Takes the core
// fragment collector and emits the viewport background and container
// border tokens the conjunction branches resolve. Values match the matrix
// recipe constants so the ported assertions read like the oracle's.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    viewportBackground: { value: '#1d4ed8' },
    containerBorder: { value: '#f97316' },
  },
})
