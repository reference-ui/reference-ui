// tokens.ts — colour fragment for the NEO-LAYERS-10 consumer. It takes no inputs and emits one
// ink colour, probeInk, with a dark leaf. The layered upstream defines a token of the same name
// with other values, so a consumer primitive that paints this token proves its own scope wins.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    probeInk: { value: '#15803d', dark: '#86efac' },
  },
})
