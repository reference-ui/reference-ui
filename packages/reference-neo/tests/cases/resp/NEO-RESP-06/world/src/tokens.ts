// tokens.ts — token fragment for the NEO-RESP-06 world. Takes the neo
// fragment collector and emits the paper color token. The probes use literal
// pixel widths, so this token only exercises the tokens layer.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    paper: { value: '#ffffff' },
  },
})
