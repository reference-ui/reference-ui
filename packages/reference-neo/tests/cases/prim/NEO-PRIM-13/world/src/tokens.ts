// tokens.ts — token fragment for the NEO-PRIM-13 world. Takes the neo
// fragment collector and emits the three tailwind-shade tokens the probes
// reference. Values match tailwind's palette so the ported assertions read
// exactly like the matrix's.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    red: {
      600: { value: '#dc2626' },
    },
    yellow: {
      100: { value: '#fef3c7' },
    },
    blue: {
      600: { value: '#2563eb' },
    },
  },
})
