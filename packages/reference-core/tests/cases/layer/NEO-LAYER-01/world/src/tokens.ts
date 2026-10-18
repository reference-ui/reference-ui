// Tokens for the LAYER-01 world. They take no input and emit the light/dark
// brand token the probes fight over plus the alarm colour the tag recipe
// paints. Collected once.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { light: '#111111', dark: '#f5f5f5' },
    alarm: { value: '#ff0000' },
  },
})
