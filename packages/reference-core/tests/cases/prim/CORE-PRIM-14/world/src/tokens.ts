// tokens.ts — token fragment for the CORE-PRIM-14 world. Takes the core
// fragment collector and emits the light/dark island token the probes
// resolve. Values match the matrix color-mode constants so the ported
// assertions read exactly like the oracle's.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    island: { value: '#dbeafe', dark: '#1e293b' },
  },
})
