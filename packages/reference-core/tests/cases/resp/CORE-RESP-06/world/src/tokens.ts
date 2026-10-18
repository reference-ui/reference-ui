// tokens.ts — token fragment for the CORE-RESP-06 world. Takes the core
// fragment collector and emits the paper color token. The probes use literal
// pixel widths, so this token only exercises the tokens layer.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    paper: { value: '#ffffff' },
  },
})
